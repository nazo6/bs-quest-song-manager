use crate::interface::{config::Config, connection::Connection};

use super::{IntoMsg, State};

#[tauri::command]
#[specta::specta]
pub async fn config_get(state: State<'_>) -> Result<Config, String> {
    Ok(state.config.read().await.clone())
}

#[tauri::command]
#[specta::specta]
pub async fn config_set_connection(
    state: State<'_>,
    connection_config: Connection,
) -> Result<(), String> {
    state.config.write().await.connection = Some(connection_config);
    state.config.read().await.write_to_file().await.to_msg()?;
    state.levels.write().await.clear();
    state.playlists.write().await.clear();
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn config_reset(state: State<'_>) -> Result<(), String> {
    *state.config.write().await = Config::default();
    state.config.read().await.write_to_file().await.to_msg()?;
    Ok(())
}
