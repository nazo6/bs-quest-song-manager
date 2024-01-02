use crate::interface::playlist::Playlist;

use super::State;

#[tauri::command]
#[specta::specta]
pub async fn playlist_get_all(ctx: State<'_>) -> Result<Vec<Playlist>, String> {
    Ok(ctx.playlists.read().await.clone())
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_clear(ctx: State<'_>) -> Result<(), String> {
    *ctx.playlists.write().await = Vec::new();
    Ok(())
}
