#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri_specta::Event;
use tracing::warn;
use tracing_subscriber::prelude::*;

use crate::interface::DeepLinkEvent;

mod api;
mod command;
mod constant;
mod core;
mod interface;
mod specta;
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

    tauri_plugin_deep_link::prepare("dev.nazo6.bqsm");

    tauri::Builder::default()
        .manage(
            state::AppState::load()
                .await
                .expect("Failed to init state!"),
        )
        .plugin(specta::specta_plugin())
        .setup(|app| {
            fn get_id(url: &str) -> Result<String, String> {
                let url = url::Url::parse(url).map_err(|e| format!("{:#}", e))?;
                let id = url
                    .path_segments()
                    .ok_or("Invalid url")?
                    .next()
                    .ok_or("No id specified")?;
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
