use crate::state::State;
use eyre::{eyre, Result, WrapErr};
use macros::create_command;

// Example command:
//
// #[tauri::command]
// pub async fn set_root(app_handle: tauri::AppHandle, state: State<'_>) -> Result<()> {
//     Ok(())
// }

#[create_command(())]
async fn set_root(state: State<'_>, path: &str) -> Result<()> {
    let path = std::path::PathBuf::from(path);
    let metadata = tokio::fs::metadata(&path).await.wrap_err_with(|| {
        format!(
            "failed to get metadata for path. Maybe not exist: {:?}",
            path
        )
    })?;
    if !metadata.is_dir() {
        Err(eyre!("path is not a directory: {:?}", path))?;
    }
    state.mod_root.write().unwrap().replace(path);
    state.write_to_file().await?;
    Ok(())
}
