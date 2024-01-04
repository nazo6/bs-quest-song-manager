use std::collections::HashMap;

use eyre::Result;
use tokio::sync::{RwLock, Semaphore};

use crate::interface::{config::Config, level::LevelMap, playlist::Playlist};

/// Application state
///
/// config: Persisted configuration
/// playlists: List of playlists
/// levels: List of levels
///
/// playlists and levels are initialized by calling `scan_start` command from frontend and not persisted.
/// So, every time application is launched, scan is needed to load playlists and levels.
/// Scan should not take long time because there are cache, so this is enough.
pub(crate) struct AppState {
    pub config: RwLock<Config>,
    pub playlists: RwLock<Vec<Playlist>>,
    pub levels: RwLock<LevelMap>,
    pub scan_state: ScanState,
}

pub struct ScanState {
    pub scan_permit: Semaphore,
}

impl AppState {
    pub async fn load() -> Result<Self> {
        let config = Config::read_from_file().await.unwrap_or_default();

        Ok(Self {
            config: RwLock::new(config),
            playlists: RwLock::new(Vec::new()),
            levels: RwLock::new(HashMap::new()),
            scan_state: ScanState {
                scan_permit: Semaphore::new(1),
            },
        })
    }
}
