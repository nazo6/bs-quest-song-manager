use super::state::AppState;

pub mod config;
pub mod level;
pub mod playlist;
pub mod scan;
pub mod misc;

pub type State<'a> = tauri::State<'a, AppState>;

trait IntoMsg<T> {
    fn to_msg(self) -> Result<T, String>;
}

impl<T> IntoMsg<T> for eyre::Result<T> {
    fn to_msg(self) -> Result<T, String> {
        self.map_err(|e| format!("{:#}", e))
    }
}

mod macros {
    /// Ensure that mod root is not None and if it is, return an error
    macro_rules! ensure_mod_root {
        ($ctx:tt) => {{
            let config = $ctx.config.read().await;
            config
                .mod_root
                .as_ref()
                .ok_or_else(|| {
                    "root path is not set. Please set it with `set-root` command".to_string()
                })?
                .clone()
        }};
    }
    pub(crate) use ensure_mod_root;
}
