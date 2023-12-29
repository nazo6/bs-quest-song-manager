use eyre::Result;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, path::PathBuf, sync::RwLock};

static CONFIG_PATH: Lazy<PathBuf> = Lazy::new(|| {
    dirs::config_dir()
        .unwrap()
        .join("bs-quest-mod-manager")
        .join("config.json")
});
static HASH_CASH: Lazy<PathBuf> = Lazy::new(|| {
    dirs::config_dir()
        .unwrap()
        .join("bs-quest-mod-manager")
        .join("hash_cache.json")
});

#[derive(Serialize, Deserialize)]
pub(crate) struct AppState {
    // Root of mod files for beatsaber.
    // In quest, this is /storage/emulated/0/ModData/com.beatgames.beatsaber
    pub mod_root: RwLock<Option<PathBuf>>,
    // Whether to cache hash of songs
    pub hash_cache_enabled: RwLock<bool>,
    pub hash_cache: RwLock<HashMap<String, String>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            mod_root: RwLock::new(None),
            hash_cache_enabled: RwLock::new(true),
            hash_cache: RwLock::new(HashMap::new()),
        }
    }
}

impl AppState {
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

pub(crate) type State<'a> = tauri::State<'a, AppState>;
