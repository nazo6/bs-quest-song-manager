use crate::interface::playlist::Playlist;

use super::Ctx;

pub async fn get_all(ctx: Ctx, _: ()) -> Vec<Playlist> {
    ctx.playlists.read().await.clone()
}

pub async fn clear(ctx: Ctx, _: ()) {
    *ctx.playlists.write().await = Vec::new();
}
