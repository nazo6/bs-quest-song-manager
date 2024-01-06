#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tracing_subscriber::prelude::*;

mod app;
mod cache;
mod constant;
mod core;
mod external;
mod interface;
mod utils;

fn main() {
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

    let runtime = tokio::runtime::Builder::new_multi_thread().build().unwrap();

    runtime.block_on(async {
        app::build()
            .await
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    });
}
