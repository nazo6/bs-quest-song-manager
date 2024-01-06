use std::path::Path;

use eyre::Context;

use super::utils::normalize_path;

#[derive(Debug, PartialEq)]
pub struct DirEntry {
    pub name: String,
    pub is_dir: bool,
}

fn next_item(str: &mut String) -> String {
    let mut to_delete = 0;
    let mut to_return = 0;

    for c in str.chars() {
        if c != ' ' && c != '\t' {
            to_return += 1;
        } else {
            break;
        }
    }

    let item = str.drain(0..to_return).collect();

    for c in str.chars() {
        if c == ' ' || c == '\t' {
            to_delete += 1;
        } else {
            break;
        }
    }

    str.drain(0..to_delete);

    item
}

fn parse_ls(str: String) -> eyre::Result<Vec<DirEntry>> {
    let mut lines = str.lines();
    lines
        .next()
        .ok_or_else(|| eyre::eyre!("No output from adb"))?;

    let mut entries = Vec::new();

    for line in lines {
        let mut line = line.to_string();
        let permissions = next_item(&mut line);
        let _ = next_item(&mut line);
        let _user = next_item(&mut line);
        let _ = next_item(&mut line);
        let _size = next_item(&mut line);
        let _date = next_item(&mut line);
        let _time = next_item(&mut line);
        let name = line;

        entries.push(DirEntry {
            name,
            is_dir: permissions.starts_with('d'),
        });
    }

    Ok(entries)
}

#[tracing::instrument(err)]
pub async fn ls(remote_path: &Path) -> eyre::Result<Vec<DirEntry>> {
    let remote_path = normalize_path(remote_path, true)?;
    let output = tokio::process::Command::new("adb")
        .args(["shell", "ls", "-l", &remote_path])
        .output()
        .await
        .wrap_err("Failed to spawn adb")?;
    let output = String::from_utf8_lossy(&output.stdout);

    let entries = parse_ls(output.to_string())?;

    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ls_parse() {
        let output = r#"total 6700
drwxrws--- 2 u0_a80 media_rw 4096 2024-01-01 21:13 010607f66ced9d437b369247e696ad7244bfd021
-rw-rw---- 1 u0_a80 media_rw  19351 2024-01-05 22:34 bl7-8 BMBF.json"#;

        assert_eq!(
            parse_ls(output.to_string()).unwrap(),
            Vec::from([
                DirEntry {
                    name: "010607f66ced9d437b369247e696ad7244bfd021".to_string(),
                    is_dir: true,
                },
                DirEntry {
                    name: "bl7-8 BMBF.json".to_string(),
                    is_dir: false,
                }
            ])
        )
    }
}
