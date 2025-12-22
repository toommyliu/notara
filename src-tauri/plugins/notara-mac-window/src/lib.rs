mod commands;

#[cfg(target_os = "macos")]
mod mac;

use crate::commands::set_theme;
use tauri::{generate_handler, plugin, plugin::TauriPlugin, Runtime};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    plugin::Builder::new("notara-mac-window")
        .invoke_handler(generate_handler![set_theme])
        .build()
}
