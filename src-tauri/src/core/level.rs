use std::path::Path;

use eyre::Context;
use tracing::info;

use crate::{
    cache::CACHE,
    constant::TEMP_DIR,
    external::beatsaver::{self, map::MapDetail},
    interface::{config::ModRoot, level::Level},
    utils::sha1_hash,
};

#[tracing::instrument(err)]
async fn install_level(download_url: &str, extract_dir: &Path) -> eyre::Result<()> {
    let url_hash = sha1_hash(download_url);
    let bytes = reqwest::get(download_url)
        .await
        .wrap_err("Failed to download map")?
        .error_for_status()
        .wrap_err("Failed to download map")?
        .bytes()
        .await
        .wrap_err("Failed to download map")?;
    let download_path = TEMP_DIR.join(format!("{}.zip", url_hash));
    let mut out = tokio::fs::File::create(&download_path)
        .await
        .wrap_err("Failed to create file")?;
    tokio::io::copy(&mut bytes.as_ref(), &mut out)
        .await
        .wrap_err("Failed to copy file")?;

    let extract_dir = extract_dir.to_owned();
    tokio::task::spawn_blocking(move || {
        let res = zip_extensions::zip_extract(&download_path, &extract_dir);
        match res {
            Ok(_) => Ok(extract_dir),
            Err(e) => Err(e),
        }
    })
    .await
    .unwrap()
    .wrap_err("Failed to extract zip")?;

    Ok(())
}

#[tracing::instrument(err)]
pub async fn fetch_remote(hash: &str) -> eyre::Result<MapDetail> {
    let res = if let Ok(res) = CACHE.get_remote_level_by_hash(hash).await {
        res
    } else {
        let res = beatsaver::map::get_map_by_hash(hash).await?;
        CACHE.set_remote_level(hash, &res).await?;
        res
    };
    Ok(res)
}

#[tracing::instrument(skip(root_dir), err)]
pub async fn install_level_by_hash(root_dir: &ModRoot, hash: String) -> eyre::Result<Level> {
    let res = fetch_remote(&hash).await?;
    let download_url = &res
        .versions
        .last()
        .ok_or_else(|| eyre::eyre!("No versions"))?
        .download_url;

    let level_dir = root_dir.level_dir().join(format!("bqsm-{}", hash));

    install_level(download_url, &level_dir).await?;
    let level = Level::load(&level_dir).await?;

    info!("Added level: {}", level.info.song_name);

    Ok(level)
}

#[tracing::instrument(skip(root_dir), err)]
pub async fn install_level_by_id(root_dir: &ModRoot, id: &str) -> eyre::Result<Level> {
    let res = if let Ok(hash) = CACHE.get_level_hash_by_id(id).await {
        if let Ok(res) = CACHE.get_remote_level_by_hash(&hash).await {
            Some(res)
        } else {
            None
        }
    } else {
        None
    };
    let res = if let Some(res) = res {
        res
    } else {
        let res = beatsaver::map::get_map_by_id(id).await?;
        let version = res
            .versions
            .last()
            .ok_or_else(|| eyre::eyre!("No versions"))?;
        CACHE.set_remote_level(&version.hash, &res).await?;
        CACHE.set_level_hash_by_id(id, &version.hash).await?;
        res
    };
    let version = &res
        .versions
        .last()
        .ok_or_else(|| eyre::eyre!("No versions"))?;

    let level_dir = root_dir.level_dir().join(format!("bqsm-{}", version.hash));

    install_level(&version.download_url, &level_dir).await?;
    let level = Level::load(&level_dir).await?;

    info!("Added level: {}", level.info.song_name);

    Ok(level)
}
