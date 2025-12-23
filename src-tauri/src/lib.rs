use std::collections::HashMap;
use std::sync::Mutex;

use notara_shortcuts::ShortcutId;
use tauri::{
    menu::{MenuBuilder, MenuItem, MenuItemBuilder, SubmenuBuilder},
    AppHandle, Emitter, Manager, State,
};

struct MenuState {
    toggle_sidebar: MenuItem<tauri::Wry>,
    new_note: MenuItem<tauri::Wry>,
    open_settings: MenuItem<tauri::Wry>,
}

struct AppMenuState(Mutex<Option<MenuState>>);

#[tauri::command]
fn update_menu_accelerators(
    app: AppHandle,
    accelerators: HashMap<ShortcutId, String>,
) -> Result<(), String> {
    let state: State<AppMenuState> = app.state();
    let guard = state.0.lock().map_err(|e| e.to_string())?;

    if let Some(menu_state) = guard.as_ref() {
        for (id, accelerator) in accelerators {
            let result = match id {
                ShortcutId::ToggleSidebar => menu_state
                    .toggle_sidebar
                    .set_accelerator(Some(&accelerator)),
                ShortcutId::NewNote => menu_state.new_note.set_accelerator(Some(&accelerator)),
                ShortcutId::OpenSettings => {
                    menu_state.open_settings.set_accelerator(Some(&accelerator))
                }
                _ => continue,
            };

            if let Err(e) = result {
                eprintln!("Failed to set accelerator for {:?}: {}", id, e);
            }
        }
    }

    Ok(())
}

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
        .manage(AppMenuState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![update_menu_accelerators])
        .setup(|app| {
            let open_settings_item = MenuItemBuilder::with_id("open-settings", "Settings...")
                .accelerator("CmdOrCtrl+,")
                .build(app)?;

            let app_submenu = SubmenuBuilder::new(app, "Notara")
                .about(None)
                .separator()
                .item(&open_settings_item)
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

            let menu_state = MenuState {
                toggle_sidebar: toggle_sidebar_item.clone(),
                new_note: new_note_item.clone(),
                open_settings: open_settings_item.clone(),
            };

            let state: State<AppMenuState> = app.state();
            *state.0.lock().unwrap() = Some(menu_state);

            app.on_menu_event(move |app, event| {
                if event.id().as_ref() == "open-settings" {
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
