use tauri::{command, Runtime, Window};

#[command]
#[allow(unused)]
pub(crate) fn set_theme<R: Runtime>(window: Window<R>, bg_color: &str) {
    #[cfg(target_os = "macos")]
    {
        if let Ok(color) = csscolorparser::parse(bg_color.trim()) {
            crate::mac::update_window_theme(window, color);
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (window, bg_color);
    }
}
