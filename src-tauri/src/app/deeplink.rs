use tauri::{App, Manager};
use tauri_specta::Event;
use tracing::warn;

use crate::interface::DeepLinkEvent;

fn get_id(url: &str) -> Result<String, String> {
    let url = url::Url::parse(url).map_err(|e| format!("{:#}", e))?;
    let id = url.host_str().ok_or("No id specified")?;
    Ok(id.to_string())
}

fn get_playlist(url: &str) -> Result<String, String> {
    let url = url::Url::parse(url).map_err(|e| format!("{:#}", e))?;
    let url = url.path().trim_start_matches('/');
    Ok(url.to_string())
}

#[cfg(target_os = "windows")]
pub fn setup_deeplink(app: &mut App) {
    use tracing::debug;

    use crate::external::deeplink;

    let handle = app.handle();
    if let Err(e) = deeplink::register(&["beatsaver", "bsplaylist"], move |url| {
        debug!("Deeplink: {}", url);
        if url.starts_with("beatsaver") {
            if let Ok(id) = get_id(&url) {
                DeepLinkEvent::Level { id }.emit_all(&handle).unwrap();
            } else {
                warn!("Invalid intial beatsaver url: {}", url);
            }
        } else if let Ok(url) = get_playlist(&url) {
            DeepLinkEvent::Playlist { url }.emit_all(&handle).unwrap();
        } else {
            warn!("Invalid intial bsplaylist url: {}", url);
        }
    }) {
        warn!("Failed to register beatsaver deeplink: {}", e);
    }

    let window = app.get_window("main").unwrap();
    if let Some(url) = std::env::args().nth(1) {
        if url.starts_with("beatsaver") {
            if let Ok(id) = get_id(&url) {
                let _ = window.eval(&format!("window.initialDeepLinkLevel='{}'", id));
            } else {
                warn!("Invalid intial beatsaver url: {}", url);
            }
        } else if let Ok(url) = get_playlist(&url) {
            let _ = window.eval(&format!("window.initialDeepLinkPlaylist='{}'", url));
        } else {
            warn!("Invalid intial bsplaylist url: {}", url);
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn setup_deeplink(_app: &mut App) {
    warn!("Deeplink not supported on this platform");
}
