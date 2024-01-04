use std::collections::HashMap;

use eyre::Context;

use crate::interface::level::{Level, LevelMap};

use super::{macros::ensure_mod_root, IntoMsg, State};

#[tauri::command]
#[specta::specta]
pub async fn level_get_all(ctx: State<'_>) -> Result<LevelMap, String> {
    let res = ctx.levels.read().await.clone();
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub async fn level_state_clear(ctx: State<'_>) -> Result<(), String> {
    *ctx.levels.write().await = HashMap::new();
    Ok(())
}

#[tracing::instrument(skip(ctx), err)]
#[tauri::command]
#[specta::specta]
pub async fn level_add_by_hash(ctx: State<'_>, hash: String) -> Result<Level, String> {
    let root = ensure_mod_root!(ctx);
    let level = crate::core::level::get_level_by_hash(&root, hash)
        .await
        .to_msg()?;
    ctx.levels
        .write()
        .await
        .insert(level.hash.clone(), level.clone());
    Ok(level)
}

#[tracing::instrument(skip(ctx), err)]
#[tauri::command]
#[specta::specta]
pub async fn level_add_by_id(ctx: State<'_>, id: String) -> Result<Level, String> {
    let root = ensure_mod_root!(ctx);
    let level = crate::core::level::get_level_by_id(&root, &id)
        .await
        .to_msg()?;
    ctx.levels
        .write()
        .await
        .insert(level.hash.clone(), level.clone());
    Ok(level)
}

#[tracing::instrument(skip(ctx), err)]
#[tauri::command]
#[specta::specta]
pub async fn level_delete(ctx: State<'_>, hash: String) -> Result<(), String> {
    let level = ctx
        .levels
        .write()
        .await
        .remove(&hash)
        .ok_or_else(|| format!("Level {} not found", hash))?;
    tokio::fs::remove_dir_all(level.path)
        .await
        .wrap_err("Failed to delete level")
        .to_msg()?;

    Ok(())
}
