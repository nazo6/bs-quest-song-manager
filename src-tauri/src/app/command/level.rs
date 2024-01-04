use crate::interface::level::Level;

use super::{macros::ensure_mod_root, IntoMsg, State};

#[tauri::command]
#[specta::specta]
pub async fn level_get_all(ctx: State<'_>) -> Result<Vec<Level>, String> {
    let res = ctx.levels.read().await.clone();
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub async fn level_clear(ctx: State<'_>) -> Result<(), String> {
    *ctx.levels.write().await = Vec::new();
    Ok(())
}

#[tracing::instrument(skip(ctx), err)]
#[tauri::command]
#[specta::specta]
pub async fn level_add_by_hash(ctx: State<'_>, hash: String) -> Result<Level, String> {
    let root = ensure_mod_root!(ctx);
    crate::core::level::level_add_by_hash(&root, hash)
        .await
        .to_msg()
}
