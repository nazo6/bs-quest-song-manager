use std::io::Read;

use eyre::Result;
use once_cell::sync::Lazy;

use crate::{
    constant::CACHE_DIR,
    external::beatsaver::map::MapDetail,
    interface::{dump::LevelDumpInfo, level::LevelInfo},
};

/// # Cache types
///
/// ## Level info
/// - hash -> level
///    Saves pair of the level hash and level data. This is most basic cache type.
/// - dirname -> hash
///     Saves pair of the directory name and level id. This cache is used to reduce scan time.
/// - level id -> hash
///     Saves pair of the level id and hash.
///
/// ## Remote level info
/// - hash -> remote level info
///     Additional level info fetched from beatsaver.
///
/// ## Beatsaver dump data (https://github.com/andruzzzhka/BeatSaberScrappedData)
/// Regulary updated data from beatsaver. Contains basic level info and stats.
pub struct Cache(opendal::Operator);

impl Cache {
    /// [get] hash -> level
    pub async fn get_level_by_hash(&self, hash: &str) -> Result<LevelInfo> {
        let hash = hash.to_string();
        let key = format!("level/data/{}", hash);
        let res = self.0.read(&key).await?;
        let level: LevelInfo = bincode::deserialize(&res)?;
        Ok(level)
    }
    /// [set] hash -> level
    pub async fn set_level(&self, hash: &str, level: &LevelInfo) -> Result<()> {
        let hash = hash.to_string();
        let key = format!("level/data/{}", hash);
        let value = bincode::serialize(level)?;
        self.0.write(&key, value).await?;
        Ok(())
    }
}

impl Cache {
    /// [get] dirname -> hash
    pub async fn get_level_hash_by_dirname(&self, dirname: &str) -> Result<String> {
        let dirname = dirname.to_string();
        let key = format!("level/dirname/{}", dirname);
        let res = self.0.read(&key).await?;
        let hash = String::from_utf8(res)?;
        Ok(hash)
    }
    /// [get] dirname -> level
    pub async fn get_level_by_dirname(&self, dirname: &str) -> Result<(LevelInfo, String)> {
        let hash = self.get_level_hash_by_dirname(dirname).await?;
        Ok((self.get_level_by_hash(&hash).await?, hash))
    }
    /// [set] dirname -> hash
    pub async fn set_level_hash_by_dirname(&self, dirname: &str, hash: &str) -> Result<()> {
        let dirname = dirname.to_string();
        let hash = hash.to_string();
        let key = format!("level/dirname/{}", dirname);
        self.0.write(&key, hash.into_bytes()).await?;
        Ok(())
    }
}
impl Cache {
    pub async fn get_level_hash_by_id(&self, id: &str) -> Result<String> {
        let id = id.to_string();
        let key = format!("level/id/{}", id);
        let res = self.0.read(&key).await?;
        let hash = String::from_utf8(res)?;
        Ok(hash)
    }
    // pub async fn get_level_by_id(&self, id: &str) -> Result<Level> {
    //     let hash = self.get_level_hash_by_id(id).await?;
    //     self.get_level_by_hash(&hash).await
    // }
    pub async fn set_level_hash_by_id(&self, id: &str, hash: &str) -> Result<()> {
        let id = id.to_string();
        let hash = hash.to_string();
        let key = format!("level/id/{}", id);
        self.0.write(&key, hash.into_bytes()).await?;
        Ok(())
    }
}

impl Cache {
    /// [get] hash -> remote level info
    pub async fn get_remote_level_by_hash(&self, hash: &str) -> Result<MapDetail> {
        let hash = hash.to_string();
        let key = format!("level-remote/data/{}", hash);
        let res = self.0.read(&key).await?;
        let level: MapDetail = bincode::deserialize(&res)?;
        Ok(level)
    }
    /// [set] hash -> level
    pub async fn set_remote_level(&self, hash: &str, level: &MapDetail) -> Result<()> {
        let hash = hash.to_string();
        let key = format!("level-remote/data/{}", hash);
        let value = bincode::serialize(level)?;
        self.0.write(&key, value).await?;
        Ok(())
    }
}

static DUMP_URL: &str = "https://raw.githubusercontent.com/andruzzzhka/BeatSaberScrappedData/master/combinedScrappedData.zip";

impl Cache {
    pub async fn get_dump_updated(&self) -> Result<String> {
        let res = self.0.read("level-dump/updated").await?;
        let str = String::from_utf8(res)?;
        Ok(str)
    }
    pub async fn update_dump(&self) -> Result<()> {
        let dump_bytes = reqwest::get(DUMP_URL).await?.bytes().await?;
        let dump_json_str = tokio::task::spawn_blocking(move || {
            let dump_zip = std::io::Cursor::new(dump_bytes);
            let mut dump_zip = zip::ZipArchive::new(dump_zip)?;
            let mut dump_file = dump_zip.by_name("combinedScrappedData.json")?;
            let mut dump_json_str = String::new();
            dump_file.read_to_string(&mut dump_json_str).unwrap();
            Ok::<_, eyre::Report>(dump_json_str)
        })
        .await
        .unwrap()?;
        let dump_raw: Vec<LevelDumpInfo> = serde_json::from_str(&dump_json_str)?;
        for mut level in dump_raw {
            level.hash = level.hash.to_lowercase();
            self.set_dump(&level.hash, &level).await?;
        }
        let current_time = chrono::Local::now().to_rfc3339();
        self.0.write("level-dump/updated", current_time).await?;
        Ok(())
    }

    pub async fn get_dump_by_hash(&self, hash: &str) -> Result<LevelDumpInfo> {
        let hash = hash.to_string();
        let key = format!("level-dump/data/{}", hash);
        let res = self.0.read(&key).await?;
        let level: LevelDumpInfo = bincode::deserialize(&res)?;
        Ok(level)
    }
    pub async fn set_dump(&self, hash: &str, level: &LevelDumpInfo) -> Result<()> {
        let hash = hash.to_string();
        let key = format!("level-dump/data/{}", hash);
        let value = bincode::serialize(level)?;
        self.0.write(&key, value).await?;
        Ok(())
    }
}

pub static CACHE: Lazy<Cache> = Lazy::new(|| {
    let mut builder = opendal::services::Sled::default();
    builder.datadir(CACHE_DIR.to_str().unwrap());

    Cache(opendal::Operator::new(builder).unwrap().finish())
});
