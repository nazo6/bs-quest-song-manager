use eyre::Context;
use tracing::info;

use crate::{api, constant::TEMP_DIR, interface::level::Level};

use super::{Ctx, IntoRspcResult};

pub async fn get_all(ctx: Ctx, _: ()) -> Vec<Level> {
    info!("Getting all levels");
    let res = ctx.levels.read().await.clone();
    info!("Got all levels");
    res
}

pub async fn clear(ctx: Ctx, _: ()) {
    *ctx.levels.write().await = Vec::new();
}

#[tracing::instrument(skip(ctx), err)]
pub async fn add_by_hash(ctx: Ctx, hash: String) -> Result<Level, rspc::Error> {
    info!("Adding level by hash: {}", hash);

    let res = api::beatsaver::map::get_map_by_hash(&hash)
        .await
        .into_internal_error()?;
    let download_url = &res
        .versions
        .last()
        .ok_or_else(|| eyre::eyre!("No versions"))
        .into_internal_error()?
        .download_url;
    let bytes = reqwest::get(download_url)
        .await
        .wrap_err("Failed to download map")
        .into_internal_error()?
        .error_for_status()
        .wrap_err("Failed to download map")
        .into_internal_error()?
        .bytes()
        .await
        .wrap_err("Failed to download map")
        .into_internal_error()?;
    let download_path = TEMP_DIR.join(format!("{}.zip", hash));
    let mut out = tokio::fs::File::create(&download_path)
        .await
        .wrap_err("Failed to create file")
        .into_internal_error()?;
    tokio::io::copy(&mut bytes.as_ref(), &mut out)
        .await
        .wrap_err("Failed to copy file")
        .into_internal_error()?;

    let extract_dir = ctx
        .config
        .read()
        .await
        .mod_root
        .clone()
        .ok_or_else(|| eyre::eyre!("Mod root is not set. Please set mod root in settings."))
        .into_bad_request()?
        .join("Mods")
        .join("SongLoader")
        .join("CustomLevels")
        .join(hash);

    let extract_dir = tokio::task::spawn_blocking(move || {
        let res = zip_extensions::zip_extract(&download_path, &extract_dir);
        match res {
            Ok(_) => Ok(extract_dir),
            Err(e) => Err(e),
        }
    })
    .await
    .unwrap()
    .wrap_err("Failed to extract zip")
    .into_internal_error()?;

    let level = Level::load_with_cache(&extract_dir, ctx.cache.clone())
        .await
        .into_internal_error()?;

    ctx.levels.write().await.push(level.clone());

    info!("Added level: {}", level.info.song_name);

    Ok(level)
}
