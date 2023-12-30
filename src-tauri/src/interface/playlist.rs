use eyre::Result;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, specta::Type, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Playlist {
    pub playlist_title: String,
    pub playlist_author: Option<String>,
    pub playlist_description: Option<String>,
    pub image: Option<String>,
    pub image_string: Option<String>,
    pub songs: Vec<Song>,
}

#[derive(Debug, Deserialize, Serialize, specta::Type, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Song {
    pub key: Option<String>,
    pub hash: String,
    pub song_name: String,
}

impl Playlist {
    pub async fn from_path(path: &PathBuf) -> Result<Self> {
        let playlist_str = tokio::fs::read_to_string(path).await?;
        Self::from_str(&playlist_str)
    }
    pub fn from_str(str: &str) -> Result<Self> {
        let playlist: Playlist = serde_json::from_str(str)?;
        Ok(playlist)
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
