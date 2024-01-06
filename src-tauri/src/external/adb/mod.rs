use std::path::Path;

use base64::Engine;
use eyre::Context;
use tokio::io::AsyncWriteExt;

pub mod ls;
mod utils;

pub use ls::ls;
use tracing::debug;

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

#[tracing::instrument(skip_all, err)]
pub async fn cat(remote_path: &Path) -> eyre::Result<String> {
    let remote_path = normalize_path(remote_path, true)?;

    let output = tokio::process::Command::new("adb")
        .args(["shell", &format!("base64 {}", &remote_path)])
        .output();

    let output = tokio::select! {
        output = output => {
            output.wrap_err("Failed to run adb")?
        },
        _ = tokio::time::sleep(std::time::Duration::from_secs(30)) => {
            return Err(eyre::eyre!("Timeout waiting for adb"));
        }
    };

    let (res, buffer) = tokio::task::spawn_blocking(move || {
        let mut encoded = String::from_utf8_lossy(&output.stdout).to_string();
        encoded = encoded.replace('\r', "");
        encoded = encoded.replace('\n', "");
        let mut buffer = Vec::<u8>::new();
        let res = base64::engine::general_purpose::STANDARD.decode_vec(encoded, &mut buffer);
        (res, buffer)
    })
    .await
    .unwrap();

    res.wrap_err("Failed to decode base64")?;

    let decoded = String::from_utf8_lossy(&buffer).to_string();

    Ok(decoded)
}

pub async fn write(remote_path: &Path, content: &str) -> eyre::Result<()> {
    let remote_path = normalize_path(remote_path, true)?;
    let mut child = tokio::process::Command::new("adb")
        .args(["shell", &format!("cat > {}", &remote_path)])
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
