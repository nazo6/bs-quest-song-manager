mod command;
mod state;

#[tokio::main]
async fn main() {
    let specta_builder = {
        let specta_builder = tauri_specta::ts::builder().commands(tauri_specta::collect_commands![
            command::config::command_set_root
        ]);

        #[cfg(debug_assertions)]
        let specta_builder = specta_builder.path("../src/bindings.ts");

        specta_builder.into_plugin()
    };

    let state = state::AppState::read_from_file().await.unwrap_or_default();

    tauri::Builder::default()
        .plugin(specta_builder)
        .manage(state)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
