use std::path::Path;

use eyre::{Context, Result};
use tokio::sync::broadcast;
use tracing::{debug, info};

use crate::{
    interface::{level::Level, playlist::Playlist},
    router::{Ctx, IntoRspcResult},
};

use super::{ScanEvent, ScanResult};

pub async fn load_levels(
    root: &Path,
    global_ctx: Ctx,
    log_sender: broadcast::Sender<ScanEvent>,
) -> Result<()> {
    let levels_path = root.join("Mods").join("SongLoader").join("CustomLevels");
    let mut level_dirs = tokio::fs::read_dir(levels_path)
        .await
        .wrap_err("Failed to read level dir")
        .into_bad_request()?;

    let mut levels = Vec::new();
    while let Ok(Some(entry)) = level_dirs.next_entry().await {
        if let Ok(file_type) = entry.file_type().await {
            if file_type.is_dir() {
                let path = entry.path();
                info!("Loading level from {:?}", path);
                let level = Level::load_with_cache(&path, global_ctx.cache.clone()).await;

                match level {
                    Ok(level) => {
                        log_sender
                            .send(ScanEvent::Level(ScanResult::Success {
                                path: path.to_string_lossy().to_string(),
                            }))
                            .unwrap();
                        levels.push(level);
                    }
                    Err(e) => {
                        dbg!(&e);
                        log_sender
                            .send(ScanEvent::Level(ScanResult::Failed {
                                path: path.to_string_lossy().to_string(),
                                reason: e.to_string(),
                            }))
                            .unwrap();
                    }
                };
                info!("Loaded level from {:?}", path);
            }
        }
    }

    *global_ctx.levels.write().await = levels;

    Ok(())
}
pub async fn load_playlists(
    root: &Path,
    global_ctx: Ctx,
    log_sender: broadcast::Sender<ScanEvent>,
) -> Result<()> {
    let playlists_path = root.join("Mods").join("PlaylistManager").join("Playlists");
    let mut playlist_files = tokio::fs::read_dir(playlists_path)
        .await
        .wrap_err("Failed to read playlist dir")
        .into_bad_request()?;

    let mut playlists = Vec::new();

    while let Ok(Some(entry)) = playlist_files.next_entry().await {
        if let Ok(file_type) = entry.file_type().await {
            if file_type.is_file() {
                match Playlist::from_path(&entry.path()).await {
                    Ok(playlist) => {
                        playlists.push(playlist);
                        log_sender
                            .send(ScanEvent::Playlist(ScanResult::Success {
                                path: entry.path().to_string_lossy().to_string(),
                            }))
                            .unwrap();
                    }
                    Err(e) => {
                        log_sender
                            .send(ScanEvent::Playlist(ScanResult::Failed {
                                path: entry.path().to_string_lossy().to_string(),
                                reason: e.to_string(),
                            }))
                            .unwrap();
                    }
                }
            }
        }
    }

    *global_ctx.playlists.write().await = playlists;

    Ok(())
}