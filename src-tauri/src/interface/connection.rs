use std::path::{Path, PathBuf};

use eyre::Context;
use serde::{Deserialize, Serialize};

use crate::external::adb;

use super::config::ModRoot;

#[derive(Debug, Serialize, Deserialize, specta::Type, Copy, Clone)]
pub enum ConnectionType {
    Adb,
    Local,
}

#[derive(Debug, Serialize, Deserialize, specta::Type, Clone)]
pub struct Connection {
    pub root: ModRoot,
    pub conn_type: ConnectionType,
}

impl Connection {
    pub async fn level_dirs(&self) -> eyre::Result<Vec<PathBuf>> {
        let path = self.root.level_dir();

        match &self.conn_type {
            ConnectionType::Adb => {
                let dirs = crate::external::adb::ls(&path)
                    .await
                    .wrap_err("Failed to list dir")?;
                let paths = dirs
                    .into_iter()
                    .filter_map(|d| {
                        if d.is_dir {
                            Some(path.join(d.name))
                        } else {
                            None
                        }
                    })
                    .collect();
                Ok(paths)
            }
            ConnectionType::Local => {
                let mut readdir = tokio::fs::read_dir(path.as_path())
                    .await
                    .wrap_err("Failed to read dir")?;
                let mut level_folders = Vec::new();
                while let Ok(Some(entry)) = readdir.next_entry().await {
                    if let Ok(file_type) = entry.file_type().await {
                        if file_type.is_dir() {
                            level_folders.push(entry.path());
                        }
                    }
                }
                Ok(level_folders)
            }
        }
    }

    pub async fn playlist_files(&self) -> eyre::Result<Vec<PathBuf>> {
        let path = self.root.playlist_dir();
        match &self.conn_type {
            ConnectionType::Adb => {
                let dirs = crate::external::adb::ls(&path)
                    .await
                    .wrap_err("Failed to list dir")?;
                let paths = dirs
                    .into_iter()
                    .filter_map(|d| {
                        if !d.is_dir {
                            Some(path.join(d.name))
                        } else {
                            None
                        }
                    })
                    .collect();
                Ok(paths)
            }
            ConnectionType::Local => {
                let mut readdir = tokio::fs::read_dir(path.as_path())
                    .await
                    .wrap_err("Failed to read dir")?;
                let mut level_folders = Vec::new();
                while let Ok(Some(entry)) = readdir.next_entry().await {
                    if let Ok(file_type) = entry.file_type().await {
                        if file_type.is_file() {
                            level_folders.push(entry.path());
                        }
                    }
                }
                Ok(level_folders)
            }
        }
    }
}

impl ConnectionType {
    pub async fn write_file_string(&self, path: &Path, data: String) -> eyre::Result<()> {
        match &self {
            ConnectionType::Adb => {
                adb::write(path, &data).await?;
                Ok(())
            }
            ConnectionType::Local => {
                tokio::fs::write(path, data)
                    .await
                    .wrap_err("Failed to write file")?;
                Ok(())
            }
        }
    }

    pub async fn read_to_string(&self, path: &Path) -> eyre::Result<String> {
        match &self {
            ConnectionType::Adb => adb::cat(path).await,
            ConnectionType::Local => {
                let data = tokio::fs::read_to_string(path)
                    .await
                    .wrap_err("Failed to read file")?;
                Ok(data)
            }
        }
    }
}
