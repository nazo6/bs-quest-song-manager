#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use cache::CACHE;
use tracing_subscriber::prelude::*;

mod app;
mod cache;
mod constant;
mod core;
mod external;
mod interface;
mod utils;

#[tokio::main]
async fn main() {
    #[cfg(debug_assertions)]
    {
        tracing_subscriber::registry()
            // .with(console_subscriber::spawn())
            .with(
                tracing_subscriber::fmt::layer().with_filter(
                    tracing_subscriber::filter::EnvFilter::builder()
                        .parse("bs_quest_song_manager=debug,info")
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

    if CACHE.get_dump_updated().await.is_err() {
        tauri::api::dialog::MessageDialogBuilder::new("Setup", "Downloading data. Please wait...")
            .show(|_| {});
        if let Err(e) = CACHE.update_dump().await {
            tauri::api::dialog::blocking::MessageDialogBuilder::new(
                "Setup",
                format!("Failed to download data. Error: {}", e),
            )
            .show();
            return;
        }
    }

    #[cfg(target_os = "windows")]
    external::deeplink::prepare("dev.nazo6.bqsm");

    app::build()
        .await
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
