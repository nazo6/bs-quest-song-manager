use crate::state::config::Config;

use super::{Ctx, IntoRspcResult};

pub async fn get(ctx: Ctx, _: ()) -> Result<Config, rspc::Error> {
    Ok(ctx.config.read().await.clone())
}

pub async fn set(ctx: Ctx, config: Config) -> Result<(), rspc::Error> {
    *ctx.config.write().await = config;
    ctx.config
        .read()
        .await
        .write_to_file()
        .await
        .into_internal_error()?;
    Ok(())
}

pub async fn reset(ctx: Ctx, _: ()) -> Result<(), rspc::Error> {
    *ctx.config.write().await = Config::default();
    ctx.config
        .read()
        .await
        .write_to_file()
        .await
        .into_internal_error()?;
    Ok(())
}
