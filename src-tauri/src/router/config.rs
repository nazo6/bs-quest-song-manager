use crate::state::config::Config;

use super::{IntoMsg, State};

#[tauri::command]
#[specta::specta]
pub async fn config_get(state: State<'_>) -> Result<Config, String> {
    Ok(state.config.read().await.clone())
}

#[tauri::command]
#[specta::specta]
pub async fn config_set(state: State<'_>, config: Config) -> Result<(), String> {
    *state.config.write().await = config;
    state.config.read().await.write_to_file().await.to_msg()?;
    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn config_reset(state: State<'_>) -> Result<(), String> {
    *state.config.write().await = Config::default();
    state.config.read().await.write_to_file().await.to_msg()?;
    Ok(())
}
