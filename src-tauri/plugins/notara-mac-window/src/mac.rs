#![allow(deprecated)]

use csscolorparser::Color;
use tauri::{Runtime, Window};

struct UnsafeWindowHandle(*mut std::ffi::c_void);

unsafe impl Send for UnsafeWindowHandle {}
unsafe impl Sync for UnsafeWindowHandle {}

// Updates the macOS window appearance based on the background color brightness.
// This sets NSAppearanceNameVibrantLight for light backgrounds and
// NSAppearanceNameVibrantDark for dark backgrounds, which tells macOS
// how to render native controls like traffic lights.
pub(crate) fn update_window_theme<R: Runtime>(window: Window<R>, color: Color) {
    use cocoa::appkit::{
        NSAppearance, NSAppearanceNameVibrantDark, NSAppearanceNameVibrantLight, NSWindow,
    };

    // Calculate brightness from RGB (0.0 - 1.0 range)
    let brightness = (color.r as f64 + color.g as f64 + color.b as f64) / 3.0;

    unsafe {
        let window_handle = UnsafeWindowHandle(window.ns_window().unwrap());

        let _ = window.run_on_main_thread(move || {
            let handle = window_handle;

            // Choose appearance based on brightness
            // >= 0.5 is considered "light", < 0.5 is "dark"
            let selected_appearance = if brightness >= 0.5 {
                NSAppearance(NSAppearanceNameVibrantLight)
            } else {
                NSAppearance(NSAppearanceNameVibrantDark)
            };

            NSWindow::setAppearance(handle.0 as cocoa::base::id, selected_appearance);
        });
    }
}
