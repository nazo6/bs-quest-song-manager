use serde::{Deserialize, Serialize};
mod r#impl;

/// Struct to represent level.
/// Contains info of all difficulties.
#[derive(Debug, Serialize, Deserialize, specta::Type, Clone)]
pub struct Level {
    pub hash: String,
    pub info: LevelInfo,
}

#[derive(Debug, Deserialize, Serialize, specta::Type, Clone)]
pub struct LevelInfo {
    #[serde(rename = "_songName")]
    pub song_name: String,
    #[serde(rename = "_songSubName")]
    pub song_sub_name: String,
    #[serde(rename = "_songAuthorName")]
    pub song_author_name: String,
    #[serde(rename = "_difficultyBeatmapSets")]
    pub difficulty_beatmap_sets: Vec<BeatMapSet>,
}

#[derive(Debug, Deserialize, Serialize, specta::Type, Clone)]
pub struct BeatMapSet {
    #[serde(rename = "_difficultyBeatmaps")]
    pub difficulty_beatmaps: Vec<BeatMap>,
}

#[derive(Debug, Deserialize, Serialize, specta::Type, Clone)]
pub struct BeatMap {
    #[serde(rename = "_difficulty")]
    pub difficulty: String,
    #[serde(rename = "_difficultyRank")]
    pub difficulty_rank: u32,
    #[serde(rename = "_beatmapFilename")]
    pub beatmap_filename: String,
}
