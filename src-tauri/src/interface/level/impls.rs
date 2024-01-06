use std::path::Path;

use eyre::{Context, Result};

use crate::{
    interface::{connection::ConnectionType, level::LevelInfo},
    utils::sha1_hash,
};

use super::Level;

impl Level {
    pub async fn load(ct: ConnectionType, level_path: &Path) -> Result<Self> {
        let info_path = level_path.join("Info.dat");
        let info_str = ct
            .read_to_string(&info_path)
            .await
            .wrap_err_with(|| format!("Failed to read info.dat at {:?}", info_path))?;

        let info: LevelInfo =
            serde_json::from_str(&info_str).wrap_err("Failed to parse info.dat")?;

        let difficulty_files = info
            .difficulty_beatmap_sets
            .iter()
            .flat_map(|set| {
                set.difficulty_beatmaps
                    .iter()
                    .map(|beatmap| level_path.join(&*beatmap.beatmap_filename))
            })
            .collect::<Vec<_>>();

        let difficulty_strs = futures::future::try_join_all(
            difficulty_files.iter().map(|path| ct.read_to_string(path)),
        )
        .await
        .wrap_err("Failed to read difficulty files")?;

        let hash =
            tokio::task::spawn_blocking(move || sha1_hash(&(info_str + &difficulty_strs.join(""))))
                .await
                .unwrap();

        let image_path = level_path.join(&info.cover_image_filename);

        Ok(Self {
            hash,
            info,
            image_path,
            path: level_path.to_path_buf(),
        })
    }
}

#[cfg(test)]
mod test {
    use std::path::PathBuf;

    use super::*;

    #[tokio::test]
    async fn level_load_1() {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("test-data")
            .join("level")
            .join("1ac0f");
        let level = Level::load(ConnectionType::Local, &path).await.unwrap();
        assert_eq!(level.hash, "84bcff4756ac66bf1746824b0b221eb1e6a4aff2");
    }
}
