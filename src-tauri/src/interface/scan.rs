use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub enum ScanResult {
    Success { path: String },
    Failed { reason: String, path: String },
}
#[derive(Debug, Clone, Serialize, specta::Type, tauri_specta::Event)]
pub enum ScanEvent {
    Level(ScanResult),
    Playlist(ScanResult),
    Completed,
    Started,
}
