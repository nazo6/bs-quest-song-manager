use tauri::{plugin::TauriPlugin, Wry};

use crate::interface::{scan::ScanEvent, DeepLinkEvent};

pub fn specta_plugin() -> TauriPlugin<Wry> {
    let specta_builder = tauri_specta::ts::builder()
        .commands(tauri_specta::collect_commands![
            crate::command::config::config_get,
            crate::command::config::config_reset,
            crate::command::config::config_set_mod_root,
            crate::command::level::level_get_all,
            crate::command::level::level_clear,
            crate::command::level::level_add_by_hash,
            crate::command::playlist::playlist_get_all,
            crate::command::playlist::playlist_clear,
            crate::command::scan::scan_start,
        ])
        .events(tauri_specta::collect_events![ScanEvent, DeepLinkEvent]);

    #[cfg(debug_assertions)]
    let specta_builder = specta_builder.path("../src/bindings.ts");

    specta_builder.into_plugin()
}
