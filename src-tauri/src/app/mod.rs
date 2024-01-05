use tauri::{plugin::TauriPlugin, Manager, Wry};
use tauri_specta::Event;
use tracing::warn;

use crate::interface::{scan::ScanEvent, DeepLinkEvent};

mod command;
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
            command::misc::open_devtools,
            command::playlist::playlist_get_all,
            command::playlist::playlist_state_clear,
            command::playlist::playlist_add_level,
            command::scan::scan_start,
        ])
        .events(tauri_specta::collect_events![ScanEvent, DeepLinkEvent]);

    #[cfg(debug_assertions)]
    let specta_builder = specta_builder.path("../src/bindings.ts");

    specta_builder.into_plugin()
}

pub async fn build() -> tauri::Builder<Wry> {
    tauri_plugin_deep_link::prepare("dev.nazo6.bqsm");

    tauri::Builder::default()
        .manage(
            state::AppState::load()
                .await
                .expect("Failed to init state!"),
        )
        .plugin(specta_plugin())
        .plugin(tauri_plugin_context_menu::init())
        .setup(|app| {
            fn get_id(url: &str) -> Result<String, String> {
                let url = url::Url::parse(url).map_err(|e| format!("{:#}", e))?;
                let id = url.host_str().ok_or("No id specified")?;
                dbg!(&url, &id);
                Ok(id.to_string())
            }

            let handle = app.handle();
            tauri_plugin_deep_link::register("beatsaver", move |request| {
                let Ok(id) = get_id(&request) else {
                    warn!("Invalid url: {}", request);
                    return;
                };
                DeepLinkEvent { id }.emit_all(&handle).unwrap();
            })
            .unwrap();

            let window = app.get_window("main").unwrap();
            #[cfg(not(target_os = "macos"))]
            if let Some(url) = std::env::args().nth(1) {
                if let Ok(id) = get_id(&url) {
                    let _ = window.eval(&format!("window.initialDeepLinkId='{}'", id));
                } else {
                    warn!("Invalid url: {}", url);
                }
            }

            Ok(())
        })
}
