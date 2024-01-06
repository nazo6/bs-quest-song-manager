use eyre::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

use crate::constant::CONFIG_FILE_PATH;

use super::connection::Connection;

#[derive(Debug, Serialize, Deserialize, specta::Type, Clone, Default)]
pub struct ModRoot(pub PathBuf);

impl ModRoot {
    pub fn level_dir(&self) -> PathBuf {
        self.0.join("Mods").join("SongLoader").join("CustomLevels")
    }
    pub fn playlist_dir(&self) -> PathBuf {
        self.0
            .join("Mods")
            .join("PlaylistManager")
            .join("Playlists")
    }
}
impl From<String> for ModRoot {
    fn from(s: String) -> Self {
        Self(PathBuf::from(s))
    }
}

#[derive(Debug, Serialize, Deserialize, specta::Type, Clone, Default)]
pub(crate) struct Config {
    // Root of mod files for beatsaber.
    // In quest, this is /storage/emulated/0/ModData/com.beatgames.beatsaber
    pub connection: Option<Connection>,
}

impl Config {
    pub async fn read_from_file() -> Result<Self> {
        let text = tokio::fs::read_to_string(CONFIG_FILE_PATH.as_path()).await?;
        let state = serde_json::from_str(&text)?;
        Ok(state)
    }
    pub async fn write_to_file(&self) -> Result<()> {
        let text = serde_json::to_string_pretty(self)?;
        tokio::fs::write(CONFIG_FILE_PATH.as_path(), text).await?;
        Ok(())
    }
}
