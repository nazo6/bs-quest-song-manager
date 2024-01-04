#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tracing_subscriber::prelude::*;

mod api;
mod constant;
mod interface;
mod router;
mod state;

#[tokio::main]
async fn main() {
    #[cfg(debug_assertions)]
    {
        tracing_subscriber::registry()
            // .with(console_subscriber::spawn())
            .with(
                tracing_subscriber::fmt::layer().with_filter(
                    tracing_subscriber::filter::EnvFilter::builder()
                        .with_default_directive(tracing::Level::DEBUG.into())
                        .parse("")
                        .unwrap(),
                ),
            )
            .init();
    }
    #[cfg(not(debug_assertions))]
    {
        tracing_subscriber::fmt()
            .with_max_level(tracing::Level::INFO)
            .init();
    }

    tauri::Builder::default()
        .manage(
            state::AppState::load()
                .await
                .expect("Failed to init state!"),
        )
        .plugin(router::specta_plugin())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
