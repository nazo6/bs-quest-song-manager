use std::path::PathBuf;

use eyre::Context;
use tracing::info;

use crate::{
    cache::CACHE,
    constant::TEMP_DIR,
    external::beatsaver::{self, map::MapDetail},
    interface::{
        connection::{Connection, ConnectionType},
        level::Level,
    },
    utils::sha1_hash,
};

#[tracing::instrument(err)]
async fn install_level(
    ct: ConnectionType,
    download_url: &str,
    target_path: PathBuf,
) -> eyre::Result<()> {
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

    match ct {
        ConnectionType::Local => {
            tokio::task::spawn_blocking(move || {
                let res = zip_extensions::zip_extract(&download_path, &target_path);
                match res {
                    Ok(_) => Ok(target_path),
                    Err(e) => Err(e),
                }
            })
            .await
            .unwrap()
            .wrap_err("Failed to extract zip")?;
        }
        ConnectionType::Adb => {
            let temp_dir = TEMP_DIR.join(format!("bqsm-{}", url_hash));
            let temp_dir = tokio::task::spawn_blocking(move || {
                let res = zip_extensions::zip_extract(&download_path, &temp_dir);
                match res {
                    Ok(_) => Ok(temp_dir),
                    Err(e) => Err(e),
                }
            })
            .await
            .unwrap()
            .wrap_err("Failed to extract zip")?;
            crate::external::adb::push(&temp_dir, &target_path).await?;
        }
    }

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

#[tracing::instrument(skip(conn), err)]
pub async fn install_level_by_hash(conn: &Connection, hash: String) -> eyre::Result<Level> {
    let res = fetch_remote(&hash).await?;
    let download_url = &res
        .versions
        .last()
        .ok_or_else(|| eyre::eyre!("No versions"))?
        .download_url;

    let download_dir = conn.root.level_dir().join(format!("bqsm-{}", hash));
    install_level(conn.conn_type, download_url, download_dir.clone()).await?;
    let level = Level::load(conn.conn_type, &download_dir).await?;

    dbg!(&level);

    info!("Added level: {}", level.info.song_name);

    Ok(level)
}

#[tracing::instrument(skip(conn), err)]
pub async fn install_level_by_id(conn: &Connection, id: &str) -> eyre::Result<Level> {
    let map_detail = if let Ok(hash) = CACHE.get_level_hash_by_id(id).await {
        if let Ok(res) = CACHE.get_remote_level_by_hash(&hash).await {
            Some(res)
        } else {
            None
        }
    } else {
        None
    };
    let map_detail = if let Some(res) = map_detail {
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
    let version = &map_detail
        .versions
        .last()
        .ok_or_else(|| eyre::eyre!("No versions"))?;

    let download_dir = conn.root.level_dir().join(format!("bqsm-{}", version.hash));
    install_level(conn.conn_type, &version.download_url, download_dir.clone()).await?;
    let level = Level::load(conn.conn_type, &download_dir).await?;

    info!("Added level: {}", level.info.song_name);

    Ok(level)
}
