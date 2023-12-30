use std::sync::{Arc, Mutex};

use crate::{
    interface::{level::Level, playlist::Playlist},
    state::State,
};
use eyre::{eyre, Result};
use macros::create_command;
use serde::{Deserialize, Serialize};
use tauri_specta::Event;

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type, tauri_specta::Event)]
pub enum ScanEvent {
    Level { succeed: u32, failed: u32 },
    Playlist { succeed: u32, failed: u32 },
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct ScanResult {
    pub levels: Vec<Level>,
    pub levels_succeed: u32,
    pub levels_failed: Vec<String>,
    pub playlists: Vec<Playlist>,
    pub playlists_succeed: u32,
    pub playlists_failed: Vec<String>,
}

#[create_command]
async fn scan_start(app_handle: tauri::AppHandle, state: State<'_>) -> Result<ScanResult> {
    let root = state
        .config
        .read()
        .await
        .mod_root
        .as_ref()
        .ok_or_else(|| eyre!("root path is not set. Please set it with `set-root` command"))?
        .clone();
    let levels_path = root.join("./Mods/SongLoader/CustomLevels");
    let playlists_path = root.join("./Mods/PlaylistManager/Playlists");

    let levels_list_fut = async {
        let mut level_dirs = tokio::fs::read_dir(levels_path).await?;
        let mut folders = Vec::new();
        while let Some(entry) = level_dirs.next_entry().await? {
            if entry.file_type().await?.is_dir() {
                folders.push(entry.path());
            }
        }

        let mut succeed_count = 0u32;
        let failed = Arc::new(Mutex::new(Vec::new()));

        ScanEvent::Level {
            succeed: succeed_count,
            failed: failed.lock().unwrap().len() as u32,
        }
        .emit_all(&app_handle)?;

        let levels = folders.into_iter().map(|path| {
            let state = state.clone();
            let app_handle = app_handle.clone();
            let failed = failed.clone();
            async move {
                let level = Level::load_with_cache(&path, state.cache.clone()).await;
                if level.is_ok() {
                    succeed_count += 1;
                } else {
                    failed
                        .lock()
                        .unwrap()
                        .push(path.to_string_lossy().to_string());
                }

                ScanEvent::Level {
                    succeed: succeed_count,
                    failed: failed.lock().unwrap().len() as u32,
                }
                .emit_all(&app_handle)?;

                level
            }
        });
        let levels = futures::future::join_all(levels)
            .await
            .into_iter()
            .flatten()
            .collect::<Vec<_>>();

        let mut failed = failed.lock().unwrap();
        let failed = std::mem::take(&mut *failed);
        Ok::<_, eyre::Error>((levels, succeed_count, failed))
    };
    let playlists_list_fut = async {
        let mut playlist_files = tokio::fs::read_dir(playlists_path).await?;

        let mut succeed_count = 0u32;
        let mut failed = vec![];
        let mut playlists = Vec::new();

        while let Some(entry) = playlist_files.next_entry().await? {
            if entry.file_type().await?.is_file() {
                match Playlist::from_path(&entry.path()).await {
                    Ok(playlist) => {
                        succeed_count += 1;
                        playlists.push(playlist);
                    }
                    Err(e) => {
                        failed.push(entry.path().to_string_lossy().to_string());
                    }
                }

                ScanEvent::Playlist {
                    succeed: succeed_count,
                    failed: failed.len() as u32,
                }
                .emit_all(&app_handle)?
            }
        }

        Ok::<_, eyre::Error>((playlists, succeed_count, failed))
    };

    let (levels_list, playlists_list) = tokio::try_join!(levels_list_fut, playlists_list_fut)?;

    Ok(ScanResult {
        levels: levels_list.0,
        levels_succeed: levels_list.1,
        levels_failed: levels_list.2,
        playlists: playlists_list.0,
        playlists_succeed: playlists_list.1,
        playlists_failed: playlists_list.2,
    })
}
