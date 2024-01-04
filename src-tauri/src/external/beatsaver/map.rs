use std::collections::HashMap;

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

pub async fn get_map_by_ids(ids: &[&str]) -> Result<HashMap<String, MapDetail>> {
    let ids = ids.join(",");
    let endpoint = format!("{}/maps/ids/{}", BASE_URL, ids);
    let res: HashMap<String, MapDetail> = reqwest::get(&endpoint)
        .await
        .wrap_err("Failed to fetch")?
        .json()
        .await
        .wrap_err("Failed to parse json")?;
    Ok(res)
}
