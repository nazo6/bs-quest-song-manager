use super::state::AppState;

pub mod config;
pub mod level;
pub mod misc;
pub mod playlist;
pub mod scan;

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
    macro_rules! ensure_conn {
        ($config:tt) => {{
            match $config.connection {
                Some(ref conn) => conn,
                None => return Err("Connection not set".to_string()),
            }
        }};
    }

    pub(crate) use ensure_conn;
}
