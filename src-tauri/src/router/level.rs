use crate::interface::level::Level;

use super::Ctx;

pub async fn get_all(ctx: Ctx, _: ()) -> Vec<Level> {
    ctx.levels.read().await.clone()
}

pub async fn clear(ctx: Ctx, _: ()) {
    *ctx.levels.write().await = Vec::new();
}
