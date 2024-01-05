use std::path::PathBuf;

use once_cell::sync::Lazy;

pub static CONFIG_FILE_PATH: Lazy<PathBuf> = Lazy::new(|| {
    let path = dirs::data_local_dir()
        .unwrap()
        .join("bs-quest-mod-manager")
        .join("config.json");
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    path
});

pub static TEMP_DIR: Lazy<PathBuf> = Lazy::new(|| {
    let path = dirs::data_local_dir()
        .unwrap()
        .join("bs-quest-mod-manager")
        .join("temp");
    std::fs::create_dir_all(&path).unwrap();
    path
});

pub static CACHE_DIR: Lazy<PathBuf> = Lazy::new(|| {
    let path = dirs::data_local_dir()
        .unwrap()
        .join("bs-quest-mod-manager")
        .join("cache-sled");
    std::fs::create_dir_all(&path).unwrap();
    path
});
