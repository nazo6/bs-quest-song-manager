use tauri::{plugin::TauriPlugin, Wry};

use crate::{interface::scan::ScanEvent, state::AppState};

mod config;
mod level;
mod playlist;
mod scan;

pub type State<'a> = tauri::State<'a, AppState>;

pub fn specta_plugin() -> TauriPlugin<Wry> {
    let specta_builder = tauri_specta::ts::builder()
        .commands(tauri_specta::collect_commands![
            config::config_get,
            config::config_set,
            config::config_reset,
            level::level_get_all,
            level::level_clear,
            level::level_add_by_hash,
            playlist::playlist_get_all,
            playlist::playlist_clear,
            scan::scan_start,
        ])
        .events(tauri_specta::collect_events![ScanEvent]);

    #[cfg(debug_assertions)]
    let specta_builder = specta_builder.path("../src/bindings.ts");

    specta_builder.into_plugin()
}

trait IntoMsg<T> {
    fn to_msg(self) -> Result<T, String>;
}

impl<T> IntoMsg<T> for eyre::Result<T> {
    fn to_msg(self) -> Result<T, String> {
        self.map_err(|e| format!("{:#}", e))
    }
}
