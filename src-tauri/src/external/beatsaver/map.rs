// use std::collections::HashMap;

use eyre::{Context, Result};
use serde::{Deserialize, Serialize};

use super::BASE_URL;

#[derive(Clone, Debug, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct MapDetail {
    pub versions: Vec<MapVersion>,
    pub id: String,
    pub description: String,
    pub stats: MapStats,
    pub ranked: bool,
    pub created_at: String,
    pub updated_at: String,
    pub last_published_at: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct MapVersion {
    pub hash: String,
    #[serde(rename = "downloadURL")]
    pub download_url: String,
    #[serde(rename = "coverURL")]
    pub cover_url: String,
    #[serde(rename = "previewURL")]
    pub preview_url: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, specta::Type)]
#[serde(rename_all = "camelCase")]
pub struct MapStats {
    plays: u32,
    downloads: u32,
    upvotes: u32,
    downvotes: u32,
    /// 0 to 1 ?
    score: f32,
}

pub async fn get_map_by_hash(hash: &str) -> Result<MapDetail> {
    let endpoint = format!("{}/maps/hash/{}", BASE_URL, hash);
    let res = reqwest::get(&endpoint)
        .await
        .wrap_err("Failed to fetch")?
        .text()
        .await
        .wrap_err("Failed to read text")?;
    let jd = &mut serde_json::Deserializer::from_str(&res);
    let res: MapDetail = serde_path_to_error::deserialize(jd).wrap_err("Failed to parse json")?;
    Ok(res)
}

pub async fn get_map_by_id(id: &str) -> Result<MapDetail> {
    let endpoint = format!("{}/maps/id/{}", BASE_URL, id);
    let res = reqwest::get(&endpoint)
        .await
        .wrap_err("Failed to fetch")?
        .text()
        .await
        .wrap_err("Failed to read text")?;
    let jd = &mut serde_json::Deserializer::from_str(&res);
    let res: MapDetail = serde_path_to_error::deserialize(jd).wrap_err("Failed to parse json")?;
    Ok(res)
}

// pub async fn get_map_by_ids(ids: &[&str]) -> Result<HashMap<String, MapDetail>> {
//     let ids = ids.join(",");
//     let endpoint = format!("{}/maps/ids/{}", BASE_URL, ids);
//     let res: HashMap<String, MapDetail> = reqwest::get(&endpoint)
//         .await
//         .wrap_err("Failed to fetch")?
//         .json()
//         .await
//         .wrap_err("Failed to parse json")?;
//     Ok(res)
// }
