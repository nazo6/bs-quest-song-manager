use std::sync::Arc;

use command::scan::ScanEvent;

mod command;
mod interface;
mod state;

#[tokio::main]
async fn main() {
    let specta_builder = {
        let specta_builder = tauri_specta::ts::builder()
            .commands(tauri_specta::collect_commands![
                command::config::config_get,
                command::config::config_set,
                command::scan::scan_start,
                command::level::levels_get,
                command::playlist::playlists_get,
            ])
            .events(tauri_specta::collect_events![ScanEvent]);

        #[cfg(debug_assertions)]
        let specta_builder = specta_builder.path("../src/bindings.ts");

        specta_builder.into_plugin()
    };

    let state = Arc::new(
        state::AppState::load()
            .await
            .expect("error while loading application state"),
    );

    tauri::Builder::default()
        .plugin(specta_builder)
        .manage(state)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
