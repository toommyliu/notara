use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    Emitter, Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(target_os = "macos")]
    {
        builder = builder.plugin(notara_mac_haptics::init());
    }

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .plugin(notara_mac_window::init())
        .setup(|app| {
            let settings_item = MenuItemBuilder::with_id("settings", "Settings...")
                .accelerator("CmdOrCtrl+,")
                .build(app)?;

            let app_submenu = SubmenuBuilder::new(app, "Notara")
                .about(None)
                .separator()
                .item(&settings_item)
                .separator()
                .services()
                .separator()
                .hide()
                .hide_others()
                .show_all()
                .separator()
                .quit()
                .build()?;

            let edit_submenu = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;

            let new_note_item = MenuItemBuilder::with_id("new-note", "New Note")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;

            let file_submenu = SubmenuBuilder::new(app, "File")
                .item(&new_note_item)
                .separator()
                .close_window()
                .build()?;

            let toggle_sidebar_item = MenuItemBuilder::with_id("toggle-sidebar", "Toggle Sidebar")
                .accelerator("CmdOrCtrl+\\")
                .build(app)?;

            let view_submenu = SubmenuBuilder::new(app, "View")
                .item(&toggle_sidebar_item)
                .build()?;

            let window_submenu = SubmenuBuilder::new(app, "Window")
                .minimize()
                .separator()
                .close_window()
                .build()?;

            let help_submenu = SubmenuBuilder::new(app, "Help").build()?;

            let menu = MenuBuilder::new(app)
                .item(&app_submenu)
                .item(&file_submenu)
                .item(&edit_submenu)
                .item(&view_submenu)
                .item(&window_submenu)
                .item(&help_submenu)
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app, event| {
                if event.id().as_ref() == "settings" {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("open-settings", ());
                    }
                } else if event.id().as_ref() == "new-note" {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("new-note", ());
                    }
                } else if event.id().as_ref() == "toggle-sidebar" {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("toggle-sidebar", ());
                    }
                }
            });

            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                let _ = window.center();
                window.open_devtools();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
