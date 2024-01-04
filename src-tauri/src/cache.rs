use eyre::Result;
use once_cell::sync::Lazy;

use crate::{constant::CACHE_DIR, interface::level::Level};

/// Cache types
///
/// 1. hash -> level
///   Saves pair of the level hash and level data. This is most basic cache type.
/// 2. dirname -> hash
///   Saves pair of the directory name and level id. This cache is used to reduce scan time.
/// 3. level id -> hash
///   Saves pair of the level id and hash.
pub struct Cache(opendal::Operator);

// basic
impl Cache {
    pub async fn get_level_by_hash(&self, hash: &str) -> Result<Level> {
        let hash = hash.to_string();
        let key = format!("level/data/{}", hash);
        let res = self.0.read(&key).await?;
        let level: Level = serde_json::from_slice(&res)?;
        Ok(level)
    }
    pub async fn set_level(&self, level: &Level) -> Result<()> {
        let hash = level.hash.to_string();
        let key = format!("level/data/{}", hash);
        let value = serde_json::to_vec(level)?;
        self.0.write(&key, value).await?;
        Ok(())
    }
}

impl Cache {
    pub async fn get_level_hash_by_dirname(&self, dirname: &str) -> Result<String> {
        let dirname = dirname.to_string();
        let key = format!("level/dirname/{}", dirname);
        let res = self.0.read(&key).await?;
        let hash = String::from_utf8(res)?;
        Ok(hash)
    }
    pub async fn get_level_by_dirname(&self, dirname: &str) -> Result<Level> {
        let hash = self.get_level_hash_by_dirname(dirname).await?;
        self.get_level_by_hash(&hash).await
    }
    pub async fn set_level_hash_by_dirname(&self, dirname: &str, hash: &str) -> Result<()> {
        let dirname = dirname.to_string();
        let hash = hash.to_string();
        let key = format!("level/dirname/{}", dirname);
        self.0.write(&key, hash.into_bytes()).await?;
        Ok(())
    }
}
// impl Cache {
//     pub async fn get_level_hash_by_id(&self, id: &str) -> Result<String> {
//         let id = id.to_string();
//         let key = format!("level/id/{}", id);
//         let res = self.0.read(&key).await?;
//         let hash = String::from_utf8(res)?;
//         Ok(hash)
//     }
//     pub async fn get_level_by_id(&self, id: &str) -> Result<Level> {
//         let hash = self.get_level_hash_by_id(id).await?;
//         self.get_level_by_hash(&hash).await
//     }
//     pub async fn set_level_hash_by_id(&self, id: &str, hash: &str) -> Result<()> {
//         let id = id.to_string();
//         let hash = hash.to_string();
//         let key = format!("level/id/{}", id);
//         self.0.write(&key, hash.into_bytes()).await?;
//         Ok(())
//     }
// }

pub static CACHE: Lazy<Cache> = Lazy::new(|| {
    let mut builder = opendal::services::Cacache::default();
    builder.datadir(CACHE_DIR.to_str().unwrap());

    Cache(opendal::Operator::new(builder).unwrap().finish())
});
