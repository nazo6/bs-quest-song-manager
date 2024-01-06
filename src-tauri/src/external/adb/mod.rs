use std::path::Path;

use eyre::Context;
use tokio::io::AsyncWriteExt;

pub mod ls;
mod utils;

pub use ls::ls;

use self::utils::normalize_path;

pub async fn push(local_path: &Path, remote_path: &Path) -> eyre::Result<()> {
    let remote_path = normalize_path(remote_path, false)?;
    let local_path = local_path
        .to_str()
        .ok_or_else(|| eyre::eyre!("Invalid local path: {:?}", local_path))?;
    tokio::process::Command::new("adb")
        .args(["push", local_path, &remote_path])
        .spawn()
        .wrap_err("Failed to spawn adb")?
        .wait()
        .await
        .wrap_err("Failed to wait for adb")?;

    Ok(())
}

pub async fn cat(remote_path: &Path) -> eyre::Result<String> {
    let remote_path = normalize_path(remote_path, true)?;
    let output = tokio::process::Command::new("adb")
        .args(["shell", "cat", &remote_path])
        .output()
        .await
        .wrap_err("Failed to spawn adb")?;
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub async fn write(remote_path: &Path, content: &str) -> eyre::Result<()> {
    let remote_path = normalize_path(remote_path, true)?;
    let mut child = tokio::process::Command::new("adb")
        .args(["shell", "cat", ">", &remote_path])
        .stdin(std::process::Stdio::piped())
        .spawn()
        .wrap_err("Failed to spawn adb")?;
    child
        .stdin
        .as_mut()
        .unwrap()
        .write_all(content.as_bytes())
        .await
        .wrap_err("Failed to write to adb")?;
    child.wait().await.wrap_err("Failed to wait for adb")?;
    Ok(())
}
