use eyre::Result;
use macros::create_command;

use crate::{interface::level::Level, state::State};

#[create_command]
async fn levels_get(state: State<'_>) -> Result<Vec<Level>> {
    Ok(state.levels.read().await.clone())
}
