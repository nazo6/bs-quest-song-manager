use std::path::Path;

use eyre::Context;
use tokio::io::AsyncWriteExt;

pub mod ls;

pub use ls::ls;

pub async fn push(local_path: &Path, remote_path: &Path) -> eyre::Result<()> {
    tokio::process::Command::new("adb")
        .args([
            "push",
            local_path.to_str().unwrap(),
            remote_path.to_str().unwrap(),
        ])
        .spawn()
        .wrap_err("Failed to spawn adb")?
        .wait()
        .await
        .wrap_err("Failed to wait for adb")?;

    Ok(())
}

pub async fn cat(remote_path: &Path) -> eyre::Result<String> {
    let output = tokio::process::Command::new("adb")
        .args(["shell", "cat", remote_path.to_str().unwrap()])
        .output()
        .await
        .wrap_err("Failed to spawn adb")?;
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub async fn write(remote_path: &Path, content: &str) -> eyre::Result<()> {
    let mut child = tokio::process::Command::new("adb")
        .args(["shell", "cat", ">", remote_path.to_str().unwrap()])
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
