use std::{path::Path};

use eyre::{Context, Result};
use futures::StreamExt;

use tracing::warn;

use crate::{
    cache::CACHE,
    interface::{
        connection::{Connection, ConnectionType},
        level::{Level, LevelMap},
        playlist::Playlist,
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
pub async fn load_levels(conn: &Connection) -> Result<LevelMap> {
    let level_dirs = conn.level_dirs().await?;

    let ct = conn.conn_type;

    let level_get_futures = level_dirs.into_iter().map(|dir_name| {
        tokio::spawn(async move {
            let level = load_level_with_cache(ct, &dir_name).await;
            match level {
                Ok(level) => {
                    // ScanEvent::Level(ScanResult::Success { path: dir_name })
                    //     .emit_all(&handle)
                    //     .unwrap();
                    Some((level.hash.clone(), level))
                }
                Err(_e) => {
                    // ScanEvent::Level(ScanResult::Failed {
                    //     path: dir_name,
                    //     reason: e.to_string(),
                    // })
                    // .emit_all(&handle)
                    // .unwrap();
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
pub async fn load_playlists(conn: &Connection) -> Result<Vec<Playlist>> {
    let playlist_files = conn.playlist_files().await?;

    dbg!(&playlist_files);

    let mut playlists = Vec::new();

    for path in &playlist_files {
        match Playlist::load(conn.conn_type, path).await {
            Ok(playlist) => {
                playlists.push(playlist);
                // ScanEvent::Playlist(ScanResult::Success {
                //     path: path.to_string(),
                // })
                // .emit_all(&apphandle)
                // .unwrap();
            }
            Err(e) => {
                warn!("Failed to load playlist {:?}: {}", path, e);
                // ScanEvent::Playlist(ScanResult::Failed {
                //     path: path.to_string(),
                //     reason: e.to_string(),
                // })
                // .emit_all(&apphandle)
                // .unwrap();
            }
        }
    }

    Ok(playlists)
}
