use crate::interface::playlist::{Playlist, PlaylistInfo, Song};

use super::{macros::ensure_conn, IntoMsg, State};

#[tauri::command]
#[specta::specta]
pub async fn playlist_get_all(state: State<'_>) -> Result<Vec<Playlist>, String> {
    Ok(state.playlists.read().await.clone())
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_state_clear(state: State<'_>) -> Result<(), String> {
    *state.playlists.write().await = Vec::new();
    Ok(())
}

#[derive(specta::Type, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistAddLevelArgs {
    pub playlist_id: u32,
    pub hash: String,
}
/// Adds existing level to playlist.
/// Playlist id is index of playlist in `playlists` array.
#[tauri::command]
#[specta::specta]
pub async fn playlist_add_level(
    state: State<'_>,
    args: PlaylistAddLevelArgs,
) -> Result<(), String> {
    let config = state.config.read().await;
    let conn = ensure_conn!(config);

    let song_name = state
        .levels
        .read()
        .await
        .get(&args.hash)
        .ok_or("Level not found")?
        .info
        .song_name
        .clone();
    let mut playlists = state.playlists.write().await;
    let playlist = playlists
        .get_mut(args.playlist_id as usize)
        .ok_or("Playlist not found")?;
    playlist.info.songs.push(Song {
        hash: args.hash,
        song_name,
    });
    playlist.save(conn.conn_type).await.to_msg()?;
    Ok(())
}

#[derive(specta::Type, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistUpdateArgs {
    pub playlist_id: u32,
    pub new_playlist: PlaylistInfo,
}
#[tauri::command]
#[specta::specta]
pub async fn playlist_update(state: State<'_>, args: PlaylistUpdateArgs) -> Result<(), String> {
    let config = state.config.read().await;
    let conn = ensure_conn!(config);

    let mut playlists = state.playlists.write().await;
    let playlist = playlists
        .get_mut(args.playlist_id as usize)
        .ok_or("Playlist not found")?;
    playlist.info = args.new_playlist;
    playlist.save(conn.conn_type).await.to_msg()?;
    Ok(())
}
