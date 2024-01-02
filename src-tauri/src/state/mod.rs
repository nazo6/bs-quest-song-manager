use eyre::Result;
use tokio::sync::{RwLock, Semaphore};

use crate::interface::{level::Level, playlist::Playlist};

mod cache;
pub mod config;

/// Application state
///
/// config: Persisted configuration
/// cache: Cache operator from OpenDAL
/// playlists: List of playlists
/// levels: List of levels
///
/// playlists and levels are initialized by calling `scan_start` command from frontend and not persisted.
/// So, every time application is launched, scan is needed to load playlists and levels.
/// Scan should not take long time because there are cache, so this is enough.
pub(crate) struct AppState {
    pub config: RwLock<config::Config>,
    pub cache: opendal::Operator,
    pub playlists: RwLock<Vec<Playlist>>,
    pub levels: RwLock<Vec<Level>>,
    pub scan_state: ScanState,
}

pub struct ScanState {
    pub scan_permit: Semaphore,
}

impl AppState {
    pub async fn load() -> Result<Self> {
        let config = config::Config::read_from_file().await.unwrap_or_default();
        let cache_operator = cache::init_operator()?;

        Ok(Self {
            config: RwLock::new(config),
            cache: cache_operator,
            playlists: RwLock::new(Vec::new()),
            levels: RwLock::new(Vec::new()),
            scan_state: ScanState {
                scan_permit: Semaphore::new(1),
            },
        })
    }
}
