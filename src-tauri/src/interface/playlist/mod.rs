use std::path::PathBuf;

use serde::{Deserialize, Serialize};

mod impls;

#[derive(Debug, Deserialize, Serialize, specta::Type, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistData {
    pub playlist_title: String,
    pub playlist_author: Option<String>,
    pub playlist_description: Option<String>,
    pub image: Option<String>,
    pub image_string: Option<String>,
    pub songs: Vec<Song>,
}

#[derive(Debug, Deserialize, Serialize, specta::Type, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Song {
    pub hash: String,
    pub song_name: String,
}

#[derive(Debug, Deserialize, Serialize, specta::Type, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Playlist {
    pub playlist_title: String,
    pub playlist_author: Option<String>,
    pub playlist_description: Option<String>,
    pub image: Option<String>,
    pub image_string: Option<String>,
    pub songs: Vec<Song>,
    pub path: PathBuf,
}

