use std::sync::Arc;

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
                        .with_default_directive(tracing::Level::INFO.into())
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
