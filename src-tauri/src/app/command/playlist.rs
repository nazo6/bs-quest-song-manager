use std::collections::HashMap;

use eyre::Context;
use tracing::debug;

use crate::interface::playlist::{Playlist, PlaylistInfo, PlaylistMap, Song};

use super::{macros::ensure_mod_root, IntoMsg, State};

#[tauri::command]
#[specta::specta]
pub async fn playlist_get_all(ctx: State<'_>) -> Result<PlaylistMap, String> {
    Ok(ctx.playlists.read().await.clone())
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_state_clear(ctx: State<'_>) -> Result<(), String> {
    *ctx.playlists.write().await = HashMap::new();
    Ok(())
}

#[derive(specta::Type, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistAddLevelArgs {
    pub playlist_hash: String,
    pub level_hash: String,
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
        .get(&args.level_hash)
        .ok_or("Level not found")?
        .info
        .song_name
        .clone();
    let mut playlists = ctx.playlists.write().await;
    let playlist = playlists
        .get_mut(&args.playlist_hash)
        .ok_or("Playlist not found")?;
    playlist.info.songs.push(Song {
        hash: args.level_hash,
        song_name,
    });
    playlist.save(true).await.to_msg()?;
    Ok(())
}

#[derive(specta::Type, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistAddArgs {
    pub file_name: String,
    pub playlist: PlaylistInfo,
}
#[tauri::command]
#[specta::specta]
pub async fn playlist_add(ctx: State<'_>, args: PlaylistAddArgs) -> Result<(), String> {
    let root = ensure_mod_root!(ctx);
    let playlist = Playlist::with_path(
        args.playlist,
        root.playlist_dir()
            .join(args.file_name)
            .with_extension("json"),
    );
    playlist.save(false).await.to_msg()?;
    ctx.playlists
        .write()
        .await
        .insert(playlist.hash.clone(), playlist);

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_add_from_url(ctx: State<'_>, url: String) -> Result<(), String> {
    let root = ensure_mod_root!(ctx);
    let resp = reqwest::get(url)
        .await
        .wrap_err("Failed to fetch playlist")
        .to_msg()?
        .error_for_status()
        .wrap_err("Failed to fetch playlist")
        .to_msg()?;
    let content_disposion = resp
        .headers()
        .get(reqwest::header::CONTENT_DISPOSITION)
        .ok_or("Missing Content-Disposition header")?;
    let file_name = content_disposion
        .to_str()
        .wrap_err("Failed to parse Content-Disposition header")
        .to_msg()?
        .split("filename=")
        .nth(1)
        .ok_or("Failed to parse Content-Disposition header")?
        .trim_matches('"')
        .to_owned();

    debug!("{}", &file_name);

    let content: PlaylistInfo = resp
        .json()
        .await
        .wrap_err("Failed to parse playlist")
        .to_msg()?;

    let playlist = Playlist::with_path(
        content,
        root.playlist_dir()
            .join(sanitize_filename::sanitize(file_name)),
    );

    playlist.save(false).await.to_msg()?;
    ctx.playlists
        .write()
        .await
        .insert(playlist.hash.clone(), playlist);

    Ok(())
}

#[derive(specta::Type, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistUpdateArgs {
    pub hash: String,
    pub new_playlist: PlaylistInfo,
}
#[tauri::command]
#[specta::specta]
pub async fn playlist_update(ctx: State<'_>, args: PlaylistUpdateArgs) -> Result<(), String> {
    let mut playlists = ctx.playlists.write().await;
    let playlist = playlists.get_mut(&args.hash).ok_or("Playlist not found")?;
    playlist.info = args.new_playlist;
    playlist.save(true).await.to_msg()?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn playlist_delete(ctx: State<'_>, playlist_hash: String) -> Result<(), String> {
    let mut playlists = ctx.playlists.write().await;
    let path = &playlists
        .get(&playlist_hash)
        .ok_or("Playlist not found")?
        .path;
    tokio::fs::remove_file(&path)
        .await
        .wrap_err("Failed to delete playlist file")
        .to_msg()?;
    playlists.remove(&playlist_hash);
    Ok(())
}
