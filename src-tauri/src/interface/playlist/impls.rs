use std::path::Path;

use eyre::Result;

use crate::interface::connection::ConnectionType;

use super::{Playlist, PlaylistInfo};

impl Playlist {
    pub async fn load(ct: ConnectionType, path: &Path) -> Result<Self> {
        let playlist_str = ct.read_to_string(path).await?;
        let playlist: PlaylistInfo = serde_json::from_str(&playlist_str)?;
        Ok(Self {
            info: playlist,
            path: path.to_path_buf(),
        })
    }
    pub async fn save(&self, ct: ConnectionType) -> Result<()> {
        let playlist_str = serde_json::to_string_pretty(&self.info)?;
        ct.write_file_string(&self.path, playlist_str).await?;
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use std::path::PathBuf;

    use super::*;

    #[tokio::test]
    async fn playlist_load_1() {
        let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("test-data")
            .join("playlist")
            .join("1.json");
        let _ = Playlist::load(ConnectionType::Local, &path).await.unwrap();
    }
}
