use tauri::{
    http::{Response, ResponseBuilder},
    plugin::TauriPlugin,
    Wry,
};

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
        // in default asset protocol, rclone mounted volume cause issue that scope is not allowed.
        // So, instead of using default asset protocol, we use custom protocol.
        // However, this handler is blocking and slow...
        .register_uri_scheme_protocol("asset2", |app, req| {
            let Ok(url) = url::Url::parse(req.uri()) else {
                return ResponseBuilder::new()
                    .status(400)
                    .body("Invalid URL".as_bytes().to_vec());
            };
            let path = percent_encoding::percent_decode_str(url.path().trim_start_matches('/'))
                .decode_utf8_lossy()
                .to_string();
            let Ok(content) = std::fs::read(path) else {
                return ResponseBuilder::new()
                    .status(400)
                    .body("Failed to read".as_bytes().to_vec());
            };
            tauri::http::ResponseBuilder::new().body(content)
        })
        .setup(|app| {
            deeplink::setup_deeplink(app);
            Ok(())
        })
}
