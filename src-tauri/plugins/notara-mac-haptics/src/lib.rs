use tauri::{
    plugin::{Builder, TauriPlugin},
    Runtime,
};

mod commands;

#[cfg(target_os = "macos")]
extern crate objc;

#[cfg(target_os = "macos")]
pub mod haptics;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("notara-mac-haptics")
        .invoke_handler(tauri::generate_handler![
            commands::is_supported,
            commands::perform
        ])
        .build()
}

pub fn is_supported() -> bool {
    // All macOS versions since 10.11 (2015) support haptics
    // Since Tauri 2 requires macOS 10.15+, we can safely assume support
    #[cfg(target_os = "macos")]
    {
        true
    }

    #[cfg(not(target_os = "macos"))]
    {
        false
    }
}
