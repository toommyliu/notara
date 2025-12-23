import { create } from "zustand";
import { persist } from "zustand/middleware";
import { invoke } from "@tauri-apps/api/core";

export type ShortcutId =
    | "toggle-sidebar"
    | "toggle-tab-bar"
    | "cycle-tab-forward"
    | "cycle-tab-backward"
    | "new-note"
    | "open-settings";

export type Modifier = "meta" | "ctrl" | "shift" | "alt";

export type ShortcutBinding = {
    key: string;
    modifiers: Modifier[];
};

export const SHORTCUT_LABELS: Record<ShortcutId, string> = {
    "toggle-sidebar": "Toggle Sidebar",
    "toggle-tab-bar": "Toggle Tab Bar",
    "cycle-tab-forward": "Next Tab",
    "cycle-tab-backward": "Previous Tab",
    "new-note": "New Note",
    "open-settings": "Settings",
};

const DEFAULT_BINDINGS: Record<ShortcutId, ShortcutBinding> = {
    "toggle-sidebar": { key: "\\", modifiers: ["meta"] },
    "toggle-tab-bar": { key: "b", modifiers: ["meta"] },
    "cycle-tab-forward": { key: "Tab", modifiers: ["ctrl"] },
    "cycle-tab-backward": { key: "Tab", modifiers: ["ctrl", "shift"] },
    "new-note": { key: "n", modifiers: ["meta"] },
    "open-settings": { key: ",", modifiers: ["meta"] },
};

// shortcuts that get synced to the menu
const MENU_SHORTCUTS: ShortcutId[] = ["toggle-sidebar", "new-note", "open-settings"];

type ShortcutsState = {
    bindings: Record<ShortcutId, ShortcutBinding>;
};

type ShortcutsActions = {
    setBinding: (id: ShortcutId, binding: ShortcutBinding) => void;
    resetToDefaults: () => void;
};

/**
 * Convert a ShortcutBinding to Tauri accelerator format
 * Note: On macOS, Cmd and Ctrl are distinct keys - we preserve this distinction
 */
export function bindingToAccelerator(binding: ShortcutBinding): string {
    const parts: string[] = [];

    for (const mod of binding.modifiers) {
        switch (mod) {
            case "meta":
                parts.push("Cmd");
                break;
            case "ctrl":
                parts.push("Ctrl");
                break;
            case "shift":
                parts.push("Shift");
                break;
            case "alt":
                parts.push("Alt");
                break;
        }
    }

    let key = binding.key;
    if (key === " ") key = "Space";

    parts.push(key.length === 1 ? key.toUpperCase() : key);

    return parts.join("+");
}

/**
 * Format binding for display in UI
 */
export function formatBindingForDisplay(binding: ShortcutBinding): string {
    const symbols: string[] = [];

    if (binding.modifiers.includes("ctrl")) symbols.push("⌃");
    if (binding.modifiers.includes("alt")) symbols.push("⌥");
    if (binding.modifiers.includes("shift")) symbols.push("⇧");
    if (binding.modifiers.includes("meta")) symbols.push("⌘");

    let key = binding.key;
    if (key === "Tab") key = "⇥";
    else if (key === " ") key = "Space";
    else if (key === "ArrowUp") key = "↑";
    else if (key === "ArrowDown") key = "↓";
    else if (key === "ArrowLeft") key = "←";
    else if (key === "ArrowRight") key = "→";
    else if (key === "Enter") key = "↩";
    else if (key === "Backspace") key = "⌫";
    else if (key === "Escape") key = "⎋";
    else if (key === "\\") key = "\\";
    else if (key === "Dead") key = "?"; // Show placeholder for dead keys
    else key = key.toUpperCase();

    symbols.push(key);
    return symbols.join(" ");
}

/**
 * Extract actual key from keyboard event
 */
function getKeyFromEvent(event: KeyboardEvent): string {
    if (event.key === "Dead" && event.code) {
        // event.code is like "KeyI" or "KeyA" - extract the letter
        const match = event.code.match(/^Key([A-Z])$/);
        if (match) {
            return match[1].toLowerCase();
        }

        // Handle digit keys
        const digitMatch = event.code.match(/^Digit([0-9])$/);
        if (digitMatch) {
            return digitMatch[1];
        }
    }
    return event.key;
}

/**
 * Check if a keyboard event matches a binding
 */
export function eventMatchesBinding(event: KeyboardEvent, binding: ShortcutBinding): boolean {
    const wantsMeta = binding.modifiers.includes("meta");
    const wantsCtrl = binding.modifiers.includes("ctrl");
    const wantsShift = binding.modifiers.includes("shift");
    const wantsAlt = binding.modifiers.includes("alt");

    const modifiersMatch =
        (wantsMeta ? event.metaKey : !event.metaKey) &&
        (wantsCtrl ? event.ctrlKey : !event.ctrlKey) &&
        (wantsShift ? event.shiftKey : !event.shiftKey) &&
        (wantsAlt ? event.altKey : !event.altKey);

    const eventKey = getKeyFromEvent(event);
    const keyMatches = eventKey.toLowerCase() === binding.key.toLowerCase();

    return modifiersMatch && keyMatches;
}

/**
 * Sync all bindings to Tauri menu accelerators
 */
async function syncMenuAccelerators(bindings: Record<ShortcutId, ShortcutBinding>) {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
        return;
    }

    try {
        const accelerators: Record<string, string> = {};

        for (const id of MENU_SHORTCUTS) {
            const binding = bindings[id];
            if (binding) {
                accelerators[id] = bindingToAccelerator(binding);
            }
        }

        console.log("[shortcuts] Syncing menu accelerators:", accelerators);
        await invoke("update_menu_accelerators", { accelerators });
        console.log("[shortcuts] Menu accelerators synced successfully");
    } catch (err) {
        console.error("[shortcuts] Failed to sync menu accelerators:", err);
    }
}

export const useShortcutsStore = create<ShortcutsState & ShortcutsActions>()(
    persist(
        (set) => ({
            bindings: { ...DEFAULT_BINDINGS },

            setBinding: (id, binding) => {
                const newBindings = { ...useShortcutsStore.getState().bindings, [id]: binding };
                set({ bindings: newBindings });
                syncMenuAccelerators(newBindings);
            },

            resetToDefaults: () => {
                set({ bindings: { ...DEFAULT_BINDINGS } });
                syncMenuAccelerators(DEFAULT_BINDINGS);
            },
        }),
        { name: "notara:shortcuts" }
    )
);

// Sync menu accelerators on initial load
if (typeof window !== "undefined") {
    setTimeout(() => {
        syncMenuAccelerators(useShortcutsStore.getState().bindings);
    }, 500);
}
