use eyre::Result;
use macros::create_command;

use crate::{interface::playlist::Playlist, state::State};

#[create_command]
async fn playlists_get(state: State<'_>) -> Result<Vec<Playlist>> {
    Ok(state.playlists.read().await.clone())
}
