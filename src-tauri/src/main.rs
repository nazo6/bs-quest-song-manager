use std::sync::Arc;

mod interface;
mod router;
mod state;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let state = Arc::new(
        state::AppState::load()
            .await
            .expect("error while loading application state"),
    );

    tauri::Builder::default()
        .plugin(rspc::integrations::tauri::plugin(
            router::router().arced(),
            move || state.clone(),
        ))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
