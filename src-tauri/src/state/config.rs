use eyre::Result;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

static CONFIG_PATH: Lazy<PathBuf> = Lazy::new(|| {
    let path = dirs::config_dir()
        .unwrap()
        .join("bs-quest-mod-manager")
        .join("config.json");
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    path
});

#[derive(Debug, Serialize, Deserialize, rspc::Type, Clone)]
pub(crate) struct Config {
    // Root of mod files for beatsaber.
    // In quest, this is /storage/emulated/0/ModData/com.beatgames.beatsaber
    pub mod_root: Option<PathBuf>,
    // Whether to cache hash of songs
    pub hash_cache_enabled: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            mod_root: None,
            hash_cache_enabled: true,
        }
    }
}

impl Config {
    pub async fn read_from_file() -> Result<Self> {
        let text = tokio::fs::read_to_string(CONFIG_PATH.as_path()).await?;
        let state = serde_json::from_str(&text)?;
        Ok(state)
    }
    pub async fn write_to_file(&self) -> Result<()> {
        let text = serde_json::to_string_pretty(self)?;
        tokio::fs::write(CONFIG_PATH.as_path(), text).await?;
        Ok(())
    }
}

