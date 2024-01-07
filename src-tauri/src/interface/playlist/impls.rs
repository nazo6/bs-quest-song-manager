use eyre::Result;
use std::path::PathBuf;

use crate::utils::sha1_hash;

use super::{Playlist, PlaylistInfo};

impl Playlist {
    pub async fn from_path(path: &PathBuf) -> Result<Self> {
        let playlist_str = tokio::fs::read_to_string(path).await?;
        let playlist: PlaylistInfo = serde_json::from_str(&playlist_str)?;
        Ok(Self {
            info: playlist,
            path: path.clone(),
            hash: sha1_hash(&path.as_os_str().to_string_lossy()),
        })
    }

    pub fn with_path(playlist: PlaylistInfo, path: PathBuf) -> Self {
        Self {
            info: playlist,
            hash: sha1_hash(&path.as_os_str().to_string_lossy()),
            path,
        }
    }

    pub async fn save(&self, allow_overwrite: bool) -> Result<()> {
        let playlist_str = serde_json::to_string_pretty(&self.info)?;
        if !allow_overwrite && self.path.exists() {
            return Err(eyre::eyre!("Playlist already exists"));
        }
        tokio::fs::write(&self.path, playlist_str).await?;
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use std::path::PathBuf;

    use super::*;

    #[tokio::test]
    async fn playlist_load_1() {
        let mut level_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        level_path.push("test-data/playlist/1.json");
        let _ = Playlist::from_path(&level_path).await.unwrap();
    }
}
