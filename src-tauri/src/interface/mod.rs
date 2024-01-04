pub mod level;
pub mod playlist;
pub mod scan;

#[derive(Clone, specta::Type, tauri_specta::Event, serde::Serialize)]
pub struct DeepLinkEvent {
    pub id: String,
}
