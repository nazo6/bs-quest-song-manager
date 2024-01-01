use std::sync::Arc;

use crate::router::{
    scan::load::{load_levels, load_playlists},
    IntoRspcResult,
};
use eyre::Result;
use eyre::{eyre, Context};
use futures::StreamExt;
use once_cell::sync::Lazy;
use rspc::MiddlewareContext;
use serde::{Deserialize, Serialize};
use tokio::sync::{broadcast, Semaphore};
use tokio_stream::wrappers::BroadcastStream;
use tracing::info;

use super::Ctx;

mod load;

#[derive(Debug, Clone, Serialize, Deserialize, rspc::Type)]
pub enum ScanResult {
    Success { path: String },
    Failed { reason: String, path: String },
}
#[derive(Debug, Clone, Serialize, rspc::Type)]
pub enum ScanEvent {
    Level(ScanResult),
    Playlist(ScanResult),
    Completed,
    Started,
}

pub struct ScanState {
    scan_permit: Semaphore,
    log_sender: broadcast::Sender<ScanEvent>,
    _log_receiver: broadcast::Receiver<ScanEvent>,
}

pub struct ScanCtx {
    global_ctx: Ctx,
    scan_state: Arc<ScanState>,
}

static SCAN_STATE: Lazy<Arc<ScanState>> = Lazy::new(|| {
    let (log_sender, _log_receiver) = broadcast::channel::<ScanEvent>(100);
    Arc::new(ScanState {
        scan_permit: Semaphore::new(1),
        log_sender,
        _log_receiver,
    })
});

pub async fn ctx_middleware(
    mw: MiddlewareContext<Ctx>,
) -> Result<rspc::MiddlewareContext<Ctx, ScanCtx>, rspc::Error> {
    let global_ctx = mw.ctx.clone();

    Ok(mw.with_ctx(ScanCtx {
        global_ctx,
        scan_state: Arc::clone(&SCAN_STATE),
    }))
}

#[tracing::instrument(skip(ctx), err, ret)]
pub async fn start(ctx: ScanCtx, _: ()) -> Result<(), rspc::Error> {
    info!("starting scan");

    ctx.scan_state.log_sender.send(ScanEvent::Started).unwrap();

    let permit = ctx.scan_state.scan_permit.try_acquire();

    if permit.is_err() {
        return Err(rspc::Error::new(
            rspc::ErrorCode::BadRequest,
            "Already scanning".to_string(),
        ));
    }

    let root = {
        let config = ctx.global_ctx.config.read().await;

        let root = config
            .mod_root
            .as_ref()
            .ok_or_else(|| eyre!("root path is not set. Please set it with `set-root` command"))
            .into_bad_request()?;
        root.clone()
    };

    futures::future::try_join(
        load_levels(
            &root,
            ctx.global_ctx.clone(),
            ctx.scan_state.log_sender.clone(),
        ),
        load_playlists(&root, ctx.global_ctx, ctx.scan_state.log_sender.clone()),
    )
    .await
    .wrap_err("Failed to load")
    .into_bad_request()?;

    ctx.scan_state
        .log_sender
        .send(ScanEvent::Completed)
        .unwrap();

    Ok(())
}

pub fn log(ctx: ScanCtx, _: ()) -> impl futures::Stream<Item = ScanEvent> {
    BroadcastStream::new(ctx.scan_state.log_sender.subscribe()).filter_map(|x| async move {
        match x {
            Ok(x) => Some(x),
            Err(e) => {
                tracing::warn!("log error: {}", e);
                None
            }
        }
    })
}
