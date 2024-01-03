use eyre::Context;
use tracing::info;

use crate::{api, constant::TEMP_DIR, interface::level::Level};

use super::{IntoMsg, State};

#[tauri::command]
#[specta::specta]
pub async fn level_get_all(ctx: State<'_>) -> Result<Vec<Level>, String> {
    info!("Getting all levels");
    let res = ctx.levels.read().await.clone();
    info!("Got all levels");
    Ok(res)
}

#[tauri::command]
#[specta::specta]
pub async fn level_clear(ctx: State<'_>) -> Result<(), String> {
    *ctx.levels.write().await = Vec::new();
    Ok(())
}

#[tracing::instrument(skip(ctx), err)]
#[tauri::command]
#[specta::specta]
pub async fn level_add_by_hash(ctx: State<'_>, hash: String) -> Result<Level, String> {
    info!("Adding level by hash: {}", hash);

    let res = api::beatsaver::map::get_map_by_hash(&hash).await.to_msg()?;
    let download_url = &res
        .versions
        .last()
        .ok_or_else(|| eyre::eyre!("No versions"))
        .to_msg()?
        .download_url;
    let bytes = reqwest::get(download_url)
        .await
        .wrap_err("Failed to download map")
        .to_msg()?
        .error_for_status()
        .wrap_err("Failed to download map")
        .to_msg()?
        .bytes()
        .await
        .wrap_err("Failed to download map")
        .to_msg()?;
    let download_path = TEMP_DIR.join(format!("{}.zip", hash));
    let mut out = tokio::fs::File::create(&download_path)
        .await
        .wrap_err("Failed to create file")
        .to_msg()?;
    tokio::io::copy(&mut bytes.as_ref(), &mut out)
        .await
        .wrap_err("Failed to copy file")
        .to_msg()?;

    let extract_dir = ctx
        .config
        .read()
        .await
        .mod_root
        .clone()
        .ok_or_else(|| eyre::eyre!("Mod root is not set. Please set mod root in settings."))
        .to_msg()?
        .join("Mods")
        .join("SongLoader")
        .join("CustomLevels")
        .join(format!("bqsm-{}", hash));

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
    .to_msg()?;

    let level = Level::load_with_cache(&extract_dir, ctx.cache.clone())
        .await
        .to_msg()?;

    ctx.levels.write().await.push(level.clone());

    info!("Added level: {}", level.info.song_name);

    Ok(level)
}
