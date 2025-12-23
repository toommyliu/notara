use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../bindings/")]
#[serde(rename_all = "kebab-case")]
pub enum ShortcutId {
    ToggleSidebar,
    ToggleTabBar,
    CycleTabForward,
    CycleTabBackward,
    CyclePaneForward,
    CyclePaneBackward,
    NewNote,
    OpenSettings,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../bindings/")]
#[serde(rename_all = "lowercase")]
pub enum Modifier {
    Meta,
    Ctrl,
    Shift,
    Alt,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../bindings/")]
pub struct ShortcutBinding {
    pub key: String,
    pub modifiers: Vec<Modifier>,
}

impl ShortcutBinding {
    pub fn new(key: &str, modifiers: &[Modifier]) -> Self {
        Self {
            key: key.to_string(),
            modifiers: modifiers.to_vec(),
        }
    }
}

struct ShortcutMeta {
    id: ShortcutId,
    label: &'static str,
    default_key: &'static str,
    default_modifiers: &'static [Modifier],
    is_menu: bool,
}

macro_rules! define_shortcuts {
    ( $( $id:ident => { label: $label:expr, key: $key:expr, mods: [$($mods:ident),*], menu: $menu:expr }, )+ ) => {
        const SHORTCUTS: &[ShortcutMeta] = &[
            $(
                ShortcutMeta {
                    id: ShortcutId::$id,
                    label: $label,
                    default_key: $key,
                    default_modifiers: &[ $( Modifier::$mods ),* ],
                    is_menu: $menu,
                },
            )+
        ];

        const ALL_SHORTCUT_IDS: &[ShortcutId] = &[
            $( ShortcutId::$id ),+
        ];
    }
}

define_shortcuts! {
    ToggleSidebar => { label: "Toggle Sidebar", key: "\\", mods: [Meta], menu: true },
    ToggleTabBar => { label: "Toggle Tab Bar", key: "b", mods: [Meta], menu: false },
    CycleTabForward => { label: "Next Tab", key: "Tab", mods: [Ctrl], menu: false },
    CycleTabBackward => { label: "Previous Tab", key: "Tab", mods: [Ctrl, Shift], menu: false },
    CyclePaneForward => { label: "Next Pane", key: "]", mods: [Alt], menu: false },
    CyclePaneBackward => { label: "Previous Pane", key: "[", mods: [Alt], menu: false },
    NewNote => { label: "New Note", key: "n", mods: [Meta], menu: true },
    OpenSettings => { label: "Settings", key: ",", mods: [Meta], menu: true },
}

impl ShortcutId {
    /// Get all shortcut IDs
    pub const fn all() -> &'static [ShortcutId] {
        ALL_SHORTCUT_IDS
    }

    fn meta(&self) -> &'static ShortcutMeta {
        // Linear scan over a very small fixed set; keeps everything in one table.
        let mut i = 0;
        while i < SHORTCUTS.len() {
            if SHORTCUTS[i].id == *self {
                return &SHORTCUTS[i];
            }
            i += 1;
        }
        unreachable!("missing metadata for shortcut id")
    }

    /// Get the display label for this shortcut
    pub fn label(&self) -> &'static str {
        self.meta().label
    }

    /// Check if this shortcut should be synced to native menus
    pub fn is_menu_shortcut(&self) -> bool {
        self.meta().is_menu
    }

    /// Get the default binding for this shortcut
    pub fn default_binding(&self) -> ShortcutBinding {
        let meta = self.meta();
        ShortcutBinding {
            key: meta.default_key.to_string(),
            modifiers: meta.default_modifiers.to_vec(),
        }
    }
}

/// Generate the index.ts content
#[cfg(test)]
fn generate_index_ts() -> String {
    #[derive(Serialize)]
    struct ShortcutDefinition {
        id: ShortcutId,
        label: &'static str,
        default_binding: ShortcutBinding,
        is_menu: bool,
    }

    let definitions_json = serde_json::to_string_pretty(
        &SHORTCUTS
            .iter()
            .map(|m| ShortcutDefinition {
                id: m.id,
                label: m.label,
                default_binding: ShortcutBinding {
                    key: m.default_key.to_string(),
                    modifiers: m.default_modifiers.to_vec(),
                },
                is_menu: m.is_menu,
            })
            .collect::<Vec<_>>(),
    )
    .unwrap();

    format!(
        r#"// AUTO-GENERATED - DO NOT EDIT

export type {{ ShortcutId }} from "./bindings/ShortcutId";
export type {{ Modifier }} from "./bindings/Modifier";
export type {{ ShortcutBinding }} from "./bindings/ShortcutBinding";

import type {{ ShortcutId }} from "./bindings/ShortcutId";
import type {{ ShortcutBinding }} from "./bindings/ShortcutBinding";

interface ShortcutDefinition {{
  id: ShortcutId;
  label: string;
  default_binding: ShortcutBinding;
  is_menu: bool;
}}

const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = {definitions_json};

export const SHORTCUT_LABELS: Record<ShortcutId, string> = Object.fromEntries(
  SHORTCUT_DEFINITIONS.map((s) => [s.id, s.label])
) as Record<ShortcutId, string>;

export const DEFAULT_BINDINGS: Record<ShortcutId, ShortcutBinding> = Object.fromEntries(
  SHORTCUT_DEFINITIONS.map((s) => [s.id, s.default_binding])
) as Record<ShortcutId, ShortcutBinding>;

export const MENU_SHORTCUTS: ShortcutId[] = SHORTCUT_DEFINITIONS
  .filter((s) => s.is_menu)
  .map((s) => s.id);

export const ALL_SHORTCUT_IDS: ShortcutId[] = SHORTCUT_DEFINITIONS.map((s) => s.id);
"#
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;

    #[test]
    fn test_shortcut_serialization() {
        let id = ShortcutId::ToggleSidebar;
        let json = serde_json::to_string(&id).unwrap();
        assert_eq!(json, "\"toggle-sidebar\"");
    }

    #[test]
    fn test_shortcut_deserialization() {
        let id: ShortcutId = serde_json::from_str("\"new-note\"").unwrap();
        assert_eq!(id, ShortcutId::NewNote);
    }

    #[test]
    fn generate_index_file() {
        let content = generate_index_ts();
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("index.ts");
        fs::write(&path, content).expect("Failed to write index.ts");
        println!("Generated: {}", path.display());
    }
}
