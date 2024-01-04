use eyre::Context;
use eyre::Result;
use tauri::AppHandle;
use tauri_specta::Event;

use crate::core::scan::{load_levels, load_playlists};
use crate::interface::scan::ScanEvent;

use super::macros::ensure_mod_root;
use super::{IntoMsg, State};

#[tracing::instrument(skip(state, handle), err, ret)]
#[tauri::command]
#[specta::specta]
pub async fn scan_start(handle: AppHandle, state: State<'_>) -> Result<(), String> {
    let root = ensure_mod_root!(state);

    let send_event = |event: ScanEvent| event.emit_all(&handle).unwrap();

    send_event(ScanEvent::Started);

    let permit = state.scan_state.scan_permit.try_acquire();

    if permit.is_err() {
        return Err("Already scanning".to_string());
    }

    let (levels, playlists) = futures::future::try_join(
        load_levels(&root, handle.clone()),
        load_playlists(handle.clone(), &root),
    )
    .await
    .wrap_err("Failed to load")
    .to_msg()?;

    *state.levels.write().await = levels;
    *state.playlists.write().await = playlists;

    send_event(ScanEvent::Completed);

    Ok(())
}
