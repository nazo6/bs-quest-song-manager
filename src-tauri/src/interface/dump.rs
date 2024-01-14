use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "PascalCase")]
pub struct LevelDumpInfo {
    pub key: String,
    pub hash: String,
    pub song_name: String,
    pub song_sub_name: String,
    pub song_author_name: String,
    pub level_author_name: String,
    pub bpm: f64,
    pub upvotes: i32,
    pub downvotes: i32,
    pub duration: f64,
}
