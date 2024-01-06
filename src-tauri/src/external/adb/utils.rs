use std::{borrow::Cow, path::Path};

use path_slash::PathExt;

pub fn normalize_path(path: &Path, shell: bool) -> eyre::Result<String> {
    let mut path = path
        .to_slash()
        .ok_or_else(|| eyre::eyre!("Invalid remote path: {:?}", path))?
        .to_string();

    if shell {
        // When passing value to adb shell, we need to escape the path
        path = format!("'{}'", path);
    }

    Ok(path)
}
