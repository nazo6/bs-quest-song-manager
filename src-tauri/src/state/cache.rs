use opendal::{services::Cacache, Operator, Result};

use crate::constant::CACHE_DIR;

pub fn init_operator() -> Result<Operator> {
    let mut builder = Cacache::default();
    builder.datadir(CACHE_DIR.to_str().unwrap());

    let op: Operator = Operator::new(builder)?.finish();
    Ok(op)
}
