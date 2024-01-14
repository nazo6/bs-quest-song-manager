pub mod config;
pub mod dump;
pub mod level;
pub mod playlist;
pub mod scan;

#[derive(Clone, specta::Type, tauri_specta::Event, serde::Serialize)]
pub enum DeepLinkEvent {
    Level { id: String },
    Playlist { url: String },
}
