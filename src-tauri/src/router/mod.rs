use std::sync::Arc;

use rspc::Config;

use crate::state::AppState;

mod config;
mod level;
mod playlist;
mod scan;

pub type Ctx = Arc<AppState>;

type Router = rspc::Router<Ctx>;

pub fn router() -> Router {
    let router = Router::new();

    #[cfg(debug_assertions)]
    let router = router.config(Config::new().export_ts_bindings("../src/bindings.ts"));

    router
        .merge(
            "config.",
            Router::new()
                .query("get", |t| t(config::get))
                .mutation("set", |t| t(config::set))
                .mutation("reset", |t| t(config::reset)),
        )
        .merge(
            "level.",
            Router::new()
                .query("get_all", |t| t(level::get_all))
                .mutation("clear", |t| t(level::clear))
                .mutation("add_by_hash", |t| t(level::add_by_hash)),
        )
        .merge(
            "scan.",
            Router::new()
                .middleware(|mw| mw.middleware(scan::ctx_middleware))
                .mutation("start", |t| t(scan::start))
                .subscription("log", |t| t(scan::log)),
        )
        .merge(
            "playlist.",
            Router::new()
                .query("get_all", |t| t(playlist::get_all))
                .mutation("clear", |t| t(playlist::clear)),
        )
        .build()
}

trait IntoRspcResult<T> {
    fn into_bad_request(self) -> Result<T, rspc::Error>;
    fn into_internal_error(self) -> Result<T, rspc::Error>;
}

impl<T> IntoRspcResult<T> for eyre::Result<T> {
    fn into_bad_request(self) -> Result<T, rspc::Error> {
        self.map_err(|e| rspc::Error::new(rspc::ErrorCode::BadRequest, format!("{:#}", e)))
    }
    fn into_internal_error(self) -> Result<T, rspc::Error> {
        self.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, format!("{:#}", e)))
    }
}
