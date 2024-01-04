use crate::state::AppState;

pub mod config;
pub mod level;
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
