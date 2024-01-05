use base64::Engine;
use eyre::{Context, Result};
use std::path::Path;

use crate::{interface::level::LevelInfo, utils::sha1_hash};

use super::Level;

impl Level {
    pub async fn load(level_dir: &Path) -> Result<Self> {
        let info_path = level_dir.join("Info.dat");
        let info_str = tokio::fs::read_to_string(&info_path)
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
                    .map(|beatmap| &*beatmap.beatmap_filename)
            })
            .collect::<Vec<_>>();
        let difficulty_strs = futures::future::try_join_all(
            difficulty_files
                .iter()
                .map(|file| tokio::fs::read_to_string(level_dir.join(file))),
        )
        .await
        .wrap_err("Failed to read difficulty files")?;

        let hash = sha1_hash(&(info_str + &difficulty_strs.join("")));

        let image_string = {
            let mut image_path = level_dir.to_owned();
            image_path.push(&info.cover_image_filename);
            let image_bytes = tokio::fs::read(&image_path)
                .await
                .wrap_err_with(|| format!("Failed to read image at {:?}", image_path))?;
            base64::engine::general_purpose::STANDARD.encode(image_bytes)
        };

        Ok(Self {
            hash,
            info,
            image_string,
            path: level_dir.to_owned(),
        })
    }
}

#[cfg(test)]
mod test {
    use std::path::PathBuf;

    use super::*;

    #[tokio::test]
    async fn level_load_1() {
        let mut level_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        level_path.push("test-data/level/1ac0f");
        let level = Level::load(&level_path).await.unwrap();
        assert_eq!(level.hash, "84bcff4756ac66bf1746824b0b221eb1e6a4aff2");
    }
}
