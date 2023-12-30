use once_cell::sync::Lazy;
use opendal::{services::Cacache, Operator, Result};
use std::path::PathBuf;

static CACHE_PATH: Lazy<PathBuf> = Lazy::new(|| {
    let path = dirs::config_dir()
        .unwrap()
        .join("bs-quest-mod-manager")
        .join("cache");
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    path
});

pub fn init_operator() -> Result<Operator> {
    let mut builder = Cacache::default();
    builder.datadir(CACHE_PATH.to_str().unwrap());

    let op: Operator = Operator::new(builder)?.finish();
    Ok(op)
}
