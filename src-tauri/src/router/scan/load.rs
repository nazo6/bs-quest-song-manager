use std::path::Path;

use eyre::{Context, Result};
use futures::StreamExt;
use tauri_specta::Event;

use crate::interface::{
    level::Level,
    playlist::Playlist,
    scan::{ScanEvent, ScanResult},
};

pub async fn load_levels(
    root: &Path,
    cache: opendal::Operator,
    handle: tauri::AppHandle,
) -> Result<Vec<Level>> {
    let levels_path = root.join("Mods").join("SongLoader").join("CustomLevels");
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
        let cache = cache.clone();
        let handle = handle.clone();
        async move {
            let level = Level::load_with_cache(&path, cache).await;

            match level {
                Ok(level) => {
                    ScanEvent::Level(ScanResult::Success {
                        path: path.to_string_lossy().to_string(),
                    })
                    .emit_all(&handle)
                    .unwrap();
                    Some(level)
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
        }
    });

    let levels = futures::stream::iter(level_get_futures)
        .buffer_unordered(10)
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .flatten()
        .collect::<Vec<_>>();

    Ok(levels)
}
pub async fn load_playlists(apphandle: tauri::AppHandle, root: &Path) -> Result<Vec<Playlist>> {
    let playlists_path = root.join("Mods").join("PlaylistManager").join("Playlists");
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
