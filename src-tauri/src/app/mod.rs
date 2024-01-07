use tauri::{plugin::TauriPlugin, Wry};

use crate::interface::{scan::ScanEvent, DeepLinkEvent};

mod command;
mod deeplink;
mod state;

pub fn specta_plugin() -> TauriPlugin<Wry> {
    let specta_builder = tauri_specta::ts::builder()
        .commands(tauri_specta::collect_commands![
            command::config::config_get,
            command::config::config_reset,
            command::config::config_set_mod_root,
            command::level::level_get_all,
            command::level::level_state_clear,
            command::level::level_add_by_hash,
            command::level::level_add_by_id,
            command::level::level_delete,
            command::level::level_fetch_remote,
            command::misc::open_devtools,
            command::playlist::playlist_get_all,
            command::playlist::playlist_state_clear,
            command::playlist::playlist_add_level,
            command::playlist::playlist_add,
            command::playlist::playlist_add_from_url,
            command::playlist::playlist_update,
            command::playlist::playlist_delete,
            command::scan::scan_start,
        ])
        .events(tauri_specta::collect_events![ScanEvent, DeepLinkEvent]);

    #[cfg(debug_assertions)]
    let specta_builder = specta_builder.path("../src/bindings.ts");

    specta_builder.into_plugin()
}

pub async fn build() -> tauri::Builder<Wry> {
    tauri::Builder::default()
        .manage(
            state::AppState::load()
                .await
                .expect("Failed to init state!"),
        )
        .plugin(specta_plugin())
        .plugin(tauri_plugin_context_menu::init())
        .setup(|app| {
            deeplink::setup_deeplink(app);
            Ok(())
        })
}
