use std::path::Path;

use eyre::{Context, Result};
use futures::StreamExt;

use tauri::AppHandle;
use tauri_specta::Event;
use tracing::{debug, info, warn};

use crate::{
    cache::CACHE,
    interface::{
        connection::{Connection, ConnectionType},
        level::{Level, LevelMap},
        playlist::Playlist,
        scan::{ScanEvent, ScanResult},
    },
};

async fn load_level_with_cache(ct: ConnectionType, path: &Path) -> Result<Level> {
    let dirname = path
        .file_name()
        .ok_or_else(|| eyre::eyre!("Failed to get dirname"))?
        .to_string_lossy()
        .to_string();
    let level = match CACHE.get_level_by_dirname(&dirname).await {
        Ok(level) => level,
        Err(_) => {
            let level = Level::load(ct, path).await?;
            CACHE
                .set_level_hash_by_dirname(&dirname, &level.hash)
                .await
                .wrap_err("Failed to write level hash to cache")?;
            CACHE
                .set_level(&level)
                .await
                .wrap_err("Failed to write level to cache")?;
            level
        }
    };
    Ok(level)
}

#[tracing::instrument(skip_all, err)]
pub async fn load_levels(handle: AppHandle, conn: &Connection) -> Result<LevelMap> {
    let level_dirs = conn.level_dirs().await?;

    let ct = conn.conn_type;

    let level_get_futures = level_dirs.into_iter().map(|path| {
        let handle = handle.clone();
        tokio::spawn(async move {
            let level = load_level_with_cache(ct, &path).await;
            match level {
                Ok(level) => {
                    // debug!("Loaded level {:?}", level.info.song_name);
                    ScanEvent::Level(ScanResult::Success {
                        path: format!("{:?}", path),
                    })
                    .emit_all(&handle)
                    .unwrap();
                    Some((level.hash.clone(), level))
                }
                Err(e) => {
                    warn!("Failed to load level {:?}: {}", path, e);
                    ScanEvent::Level(ScanResult::Failed {
                        path: format!("{:?}", path),
                        reason: format!("{:#}", e),
                    })
                    .emit_all(&handle)
                    .unwrap();
                    None
                }
            }
        })
    });

    let levels = futures::stream::iter(level_get_futures)
        .buffer_unordered(500)
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .flatten()
        .flatten()
        .collect::<LevelMap>();

    info!("Loaded {} levels", levels.len());

    Ok(levels)
}

#[tracing::instrument(skip_all, err)]
pub async fn load_playlists(handle: AppHandle, conn: &Connection) -> Result<Vec<Playlist>> {
    let playlist_files = conn.playlist_files().await?;

    let playlist_get_futures = playlist_files.into_iter().map(|path| {
        let handle = handle.clone();
        let ct = conn.conn_type;
        tokio::spawn(async move {
            match Playlist::load(ct, &path).await {
                Ok(playlist) => {
                    // debug!("Loaded playlist {:?}", playlist.info.playlist_title);
                    ScanEvent::Playlist(ScanResult::Success {
                        path: path.into_os_string().into_string().unwrap_or_default(),
                    })
                    .emit_all(&handle)
                    .unwrap();
                    Some(playlist)
                }
                Err(e) => {
                    warn!("Failed to load playlist {:?}: {}", path, e);
                    ScanEvent::Playlist(ScanResult::Failed {
                        path: path.into_os_string().into_string().unwrap_or_default(),
                        reason: e.to_string(),
                    })
                    .emit_all(&handle)
                    .unwrap();
                    None
                }
            }
        })
    });

    let playlists = futures::stream::iter(playlist_get_futures)
        .buffer_unordered(500)
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .flatten()
        .flatten()
        .collect::<Vec<Playlist>>();

    info!("Loaded {} playlists", playlists.len());

    Ok(playlists)
}
