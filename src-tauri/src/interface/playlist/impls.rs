use eyre::Result;
use std::path::PathBuf;

use super::{Playlist, PlaylistData};

impl Playlist {
    pub async fn from_path(path: &PathBuf) -> Result<Self> {
        let playlist_str = tokio::fs::read_to_string(path).await?;
        let playlist: PlaylistData = serde_json::from_str(&playlist_str)?;
        Ok(Self::with_path(playlist, path.clone()))
    }
    pub async fn save(&self) -> Result<()> {
        let playlist_str = serde_json::to_string_pretty(self)?;
        tokio::fs::write(&self.path, playlist_str).await?;
        Ok(())
    }
    pub fn with_path(data: PlaylistData, path: PathBuf) -> Self {
        Playlist {
            playlist_title: data.playlist_title,
            playlist_author: data.playlist_author,
            playlist_description: data.playlist_description,
            image: data.image,
            image_string: data.image_string,
            songs: data.songs,
            path,
        }
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
