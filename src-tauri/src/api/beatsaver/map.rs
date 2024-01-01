use eyre::{Context, Result};
use serde::{Deserialize, Serialize};

use super::BASE_URL;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MapDetail {
    pub versions: Vec<MapVersion>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MapVersion {
    pub hash: String,
    // pub key: String,
    #[serde(rename = "downloadURL")]
    pub download_url: String,
}

pub async fn get_map_by_hash(hash: &str) -> Result<MapDetail> {
    let endpoint = format!("{}/maps/hash/{}", BASE_URL, hash);
    let res: MapDetail = reqwest::get(&endpoint)
        .await
        .wrap_err("Failed to fetch")?
        .json()
        .await
        .wrap_err("Failed to parse json")?;
    Ok(res)
}
