use std::path::Path;

use eyre::{Context, Result};
use futures::StreamExt;
use tauri_specta::Event;
// use tracing::debug;

use crate::{
    cache::CACHE,
    interface::{
        config::ModRoot,
        level::{Level, LevelMap},
        playlist::{Playlist, PlaylistMap},
        scan::{ScanEvent, ScanResult},
    },
};

async fn load_level_with_cache(path: &Path) -> Result<Level> {
    // let time = std::time::Instant::now();
    let dirname = path
        .file_name()
        .ok_or_else(|| eyre::eyre!("Failed to find dirname"))?
        .to_str()
        .ok_or_else(|| eyre::eyre!("Failed to convert dirname to str"))?;

    let cache = CACHE.get_level_by_dirname(dirname).await;

    let level = match cache {
        Ok((level, hash)) => {
            // debug!("Loaded level from cache with time {:?}", time.elapsed());
            Level::with_path(level, hash, path.to_path_buf())
        }
        Err(_) => {
            let level = Level::load(path).await?;
            CACHE
                .set_level_hash_by_dirname(dirname, &level.hash)
                .await
                .wrap_err("Failed to write level hash to cache")?;
            CACHE
                .set_level(&level.hash, &level.info)
                .await
                .wrap_err("Failed to write level to cache")?;
            // debug!("Loaded level from disk with time {:?}", time.elapsed());
            level
        }
    };
    Ok(level)
}

#[tracing::instrument(skip_all, err)]
pub async fn load_levels(root: &ModRoot, handle: tauri::AppHandle) -> Result<LevelMap> {
    let levels_path = root.level_dir();
    let mut level_dirs = tokio::fs::read_dir(levels_path)
        .await
        .wrap_err("Failed to read level dir")?;

    let mut level_folders = Vec::new();
    while let Ok(Some(entry)) = level_dirs.next_entry().await {
        if let Ok(file_type) = entry.file_type().await {
            if file_type.is_dir() {
                level_folders.push(entry.path());
            }
        }
    }

    let level_get_futures = level_folders.into_iter().map(|path| {
        let handle = handle.clone();
        tokio::spawn(async move {
            let level = load_level_with_cache(&path).await;
            match level {
                Ok(level) => {
                    ScanEvent::Level(ScanResult::Success {
                        path: path.to_string_lossy().to_string(),
                    })
                    .emit_all(&handle)
                    .unwrap();
                    Some((level.hash.clone(), level))
                }
                Err(e) => {
                    ScanEvent::Level(ScanResult::Failed {
                        path: path.to_string_lossy().to_string(),
                        reason: e.to_string(),
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

    Ok(levels)
}

#[tracing::instrument(skip_all, err)]
pub async fn load_playlists(handle: tauri::AppHandle, root: &ModRoot) -> Result<PlaylistMap> {
    let playlists_path = root.playlist_dir();
    let mut playlist_files = tokio::fs::read_dir(playlists_path)
        .await
        .wrap_err("Failed to read playlist dir")?;

    let mut playlist_folders = Vec::new();
    while let Ok(Some(entry)) = playlist_files.next_entry().await {
        if let Ok(file_type) = entry.file_type().await {
            if file_type.is_file() {
                playlist_folders.push(entry.path());
            }
        }
    }

    let playlist_get_futures = playlist_folders.into_iter().map(|path| {
        let handle = handle.clone();
        tokio::spawn(async move {
            let playlist = Playlist::from_path(&path).await;
            match playlist {
                Ok(playlist) => {
                    ScanEvent::Playlist(ScanResult::Success {
                        path: path.to_string_lossy().to_string(),
                    })
                    .emit_all(&handle)
                    .unwrap();
                    Some((playlist.hash.clone(), playlist))
                }
                Err(e) => {
                    ScanEvent::Playlist(ScanResult::Failed {
                        path: path.to_string_lossy().to_string(),
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
        .buffer_unordered(10)
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .flatten()
        .flatten()
        .collect::<PlaylistMap>();

    Ok(playlists)
}
