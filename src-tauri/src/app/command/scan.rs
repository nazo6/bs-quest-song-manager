use eyre::Context;
use eyre::Result;
use tauri::AppHandle;
use tauri_specta::Event;

use crate::app::command::macros::ensure_conn;
use crate::core::scan::{load_levels, load_playlists};
use crate::interface::scan::ScanEvent;

use super::{IntoMsg, State};

#[tracing::instrument(skip(state, handle), err)]
#[tauri::command]
#[specta::specta]
pub async fn scan_start(handle: AppHandle, state: State<'_>) -> Result<(), String> {
    let config = state.config.read().await;
    let conn = ensure_conn!(config);

    ScanEvent::Started.emit_all(&handle).unwrap();

    let permit = state.scan_state.scan_permit.try_acquire();

    if permit.is_err() {
        return Err("Already scanning".to_string());
    }

    let conn = conn.clone();

    let (levels, playlists) = {
        let handle = handle.clone();

        tokio::spawn(async move {
            tokio::try_join!(
                load_levels(handle.clone(), &conn),
                load_playlists(handle, &conn)
            )
        })
        .await
        .unwrap()
        .wrap_err("Failed to load")
        .to_msg()?
    };

    *state.levels.write().await = levels;
    *state.playlists.write().await = playlists;

    ScanEvent::Completed.emit_all(&handle).unwrap();

    tracing::info!("Scan completed");

    Ok(())
}
