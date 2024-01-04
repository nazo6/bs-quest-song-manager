use crate::interface::playlist::{Playlist, Song};

use super::{IntoMsg, State};

#[tauri::command]
#[specta::specta]
pub async fn playlist_get_all(ctx: State<'_>) -> Result<Vec<Playlist>, String> {
    Ok(ctx.playlists.read().await.clone())
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_state_clear(ctx: State<'_>) -> Result<(), String> {
    *ctx.playlists.write().await = Vec::new();
    Ok(())
}

/// Adds existing level to playlist.
/// Playlist id is index of playlist in `playlists` array.
#[tauri::command]
#[specta::specta]
pub async fn playlist_add_existing_level(
    ctx: State<'_>,
    playlist_id: u32,
    hash: String,
) -> Result<(), String> {
    let song_name = ctx
        .levels
        .read()
        .await
        .get(&hash)
        .ok_or("Level not found")?
        .info
        .song_name
        .clone();
    let mut playlists = ctx.playlists.write().await;
    let playlist = playlists
        .get_mut(playlist_id as usize)
        .ok_or("Playlist not found")?;
    playlist.songs.push(Song { hash, song_name });
    playlist.save().await.to_msg()?;
    Ok(())
}
