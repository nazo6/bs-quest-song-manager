use crate::state::{config::Config, State};
use eyre::Result;
use macros::create_command;

#[create_command]
async fn config_set(state: State<'_>, config: Config) -> Result<()> {
    *state.config.write().await = config;
    state.config.read().await.write_to_file().await?;
    Ok(())
}

#[create_command]
async fn config_get(state: State<'_>) -> Result<Config> {
    Ok(state.config.read().await.clone())
}
