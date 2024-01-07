use std::{collections::HashMap, path::PathBuf};

use serde::{Deserialize, Serialize};

mod impls;

#[derive(Debug, Deserialize, Serialize, specta::Type, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Playlist {
    pub info: PlaylistInfo,
    pub path: PathBuf,
    /// Calculated from path
    pub hash: String,
}

#[derive(Debug, Deserialize, Serialize, specta::Type, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlaylistInfo {
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

pub type PlaylistMap = HashMap<String, Playlist>;

