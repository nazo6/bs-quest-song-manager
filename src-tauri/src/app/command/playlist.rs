use crate::interface::playlist::{Playlist, PlaylistInfo, Song};

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
pub async fn playlist_add_level(ctx: State<'_>, args: PlaylistAddLevelArgs) -> Result<(), String> {
    let song_name = ctx
        .levels
        .read()
        .await
        .get(&args.hash)
        .ok_or("Level not found")?
        .info
        .song_name
        .clone();
    let mut playlists = ctx.playlists.write().await;
    let playlist = playlists
        .get_mut(args.playlist_id as usize)
        .ok_or("Playlist not found")?;
    playlist.info.songs.push(Song {
        hash: args.hash,
        song_name,
    });
    playlist.save().await.to_msg()?;
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
pub async fn playlist_update(ctx: State<'_>, args: PlaylistUpdateArgs) -> Result<(), String> {
    let mut playlists = ctx.playlists.write().await;
    let playlist = playlists
        .get_mut(args.playlist_id as usize)
        .ok_or("Playlist not found")?;
    playlist.info = args.new_playlist;
    playlist.save().await.to_msg()?;
    Ok(())
}
