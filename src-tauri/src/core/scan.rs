use std::path::Path;

use eyre::{Context, Result};
use futures::StreamExt;
use tauri_specta::Event;

use crate::{
    cache::CACHE,
    interface::{
        config::ModRoot,
        level::{Level, LevelMap},
        playlist::Playlist,
        scan::{ScanEvent, ScanResult},
    },
};

async fn load_level_with_cache(path: &Path) -> Result<Level> {
    let dirname = path
        .file_name()
        .ok_or_else(|| eyre::eyre!("Failed to find dirname"))?
        .to_str()
        .ok_or_else(|| eyre::eyre!("Failed to convert dirname to str"))?;

    let level = match CACHE.get_level_by_dirname(dirname).await {
        Ok(level) => level,
        Err(_) => {
            let level = Level::load(path).await?;
            CACHE
                .set_level_hash_by_dirname(dirname, &level.hash)
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
pub async fn load_playlists(apphandle: tauri::AppHandle, root: &ModRoot) -> Result<Vec<Playlist>> {
    let playlists_path = root.playlist_dir();
    let mut playlist_files = tokio::fs::read_dir(playlists_path)
        .await
        .wrap_err("Failed to read playlist dir")?;

    let mut playlists = Vec::new();

    while let Ok(Some(entry)) = playlist_files.next_entry().await {
        if let Ok(file_type) = entry.file_type().await {
            if file_type.is_file() {
                match Playlist::from_path(&entry.path()).await {
                    Ok(playlist) => {
                        playlists.push(playlist);
                        ScanEvent::Playlist(ScanResult::Success {
                            path: entry.path().to_string_lossy().to_string(),
                        })
                        .emit_all(&apphandle)
                        .unwrap();
                    }
                    Err(e) => {
                        ScanEvent::Playlist(ScanResult::Failed {
                            path: entry.path().to_string_lossy().to_string(),
                            reason: e.to_string(),
                        })
                        .emit_all(&apphandle)
                        .unwrap();
                    }
                }
            }
        }
    }

    Ok(playlists)
}
