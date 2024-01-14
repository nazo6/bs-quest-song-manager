use crate::{cache::CACHE, interface::dump::LevelDumpInfo};

use super::IntoMsg;

#[tauri::command]
#[specta::specta]
pub async fn cache_dump_get(hash: String) -> Result<LevelDumpInfo, String> {
    CACHE.get_dump_by_hash(&hash).await.to_msg()
}

#[tauri::command]
#[specta::specta]
pub async fn cache_dump_update() -> Result<(), String> {
    CACHE.update_dump().await.to_msg()
}
