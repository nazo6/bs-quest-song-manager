use eyre::{Context, ContextCompat, Result};
use opendal::Operator;
use sha1::{Digest, Sha1};
use std::path::Path;

use crate::interface::level::LevelInfo;

use super::Level;

impl Level {
    pub async fn load(level_dir: &Path) -> Result<Self> {
        let info_str = tokio::fs::read_to_string(level_dir.join("Info.dat")).await?;
        let info: LevelInfo = serde_json::from_str(&info_str)?;
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

        let hash = {
            let mut hasher = <Sha1 as Digest>::new();
            let hash_str = info_str + &difficulty_strs.join("");
            hasher.update(hash_str);
            format!("{:x}", hasher.finalize())
        };

        Ok(Self { hash, info })
    }
    pub async fn load_with_cache(level_dir: &Path, cache: Operator) -> Result<Self> {
        let dirname = level_dir
            .file_name()
            .wrap_err("Failed to find dirname")?
            .to_str()
            .wrap_err("Failed to convert dirname to str")?;
        if let Ok(bytes) = cache.read(&format!("level/{}/file", dirname)).await {
            serde_json::from_slice(&bytes).wrap_err("Failed to deserialize level from cache")
        } else {
            let level = Self::load(level_dir).await?;
            let bytes = serde_json::to_vec(&level).wrap_err("Failed to serialize level")?;
            cache
                .write(&format!("level/{}/file", dirname), bytes)
                .await
                .wrap_err("Failed to write level to cache")?;
            Ok(level)
        }
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
