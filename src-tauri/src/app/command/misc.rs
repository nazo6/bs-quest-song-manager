use tauri::{AppHandle, Manager};

#[tracing::instrument(skip_all, err)]
#[tauri::command]
#[specta::specta]
pub async fn open_devtools(app: AppHandle) -> Result<(), String> {
    let win = app.get_window("main").ok_or("Failed to get window")?;
    win.open_devtools();

    Ok(())
}
