use crate::{
    interface::scan::ScanEvent,
    router::{
        scan::load::{load_levels, load_playlists},
        IntoMsg,
    },
};
use eyre::Result;
use eyre::{eyre, Context};
use tauri::AppHandle;
use tauri_specta::Event;
use tracing::info;

use super::State;

mod load;

#[tracing::instrument(skip(state, handle), err, ret)]
#[tauri::command]
#[specta::specta]
pub async fn scan_start(handle: AppHandle, state: State<'_>) -> Result<(), String> {
    info!("starting scan");

    let send_event = |event: ScanEvent| event.emit_all(&handle).unwrap();

    send_event(ScanEvent::Started);

    let permit = state.scan_state.scan_permit.try_acquire();

    if permit.is_err() {
        return Err("Already scanning".to_string());
    }

    let root = {
        let config = state.config.read().await;

        let root = config
            .mod_root
            .as_ref()
            .ok_or_else(|| eyre!("root path is not set. Please set it with `set-root` command"))
            .to_msg()?;
        root.clone()
    };

    let (levels, playlists) = futures::future::try_join(
        load_levels(&root, state.cache.clone(), handle.clone()),
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
