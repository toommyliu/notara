import { useEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { listen } from "@tauri-apps/api/event";

import { AppHeader } from "~/components/layout/app-header";
import { AppSidebar } from "~/components/layout/app-sidebar";
import { TitlebarSpacer } from "~/components/layout/app-titlebar";
import { IconRibbon } from "~/components/layout/icon-ribbon";
import { SettingsDialogContent } from "~/components/settings-dialog";
import { SidebarInset, SidebarProvider, useSidebar } from "~/ui/sidebar";

import { useTabsStore } from "~/stores/tabs-store";
import { useNotesStore } from "~/stores/notes-store";
import { useSettingsStore } from "~/stores/settings-store";
import { useShortcutsStore, eventMatchesBinding, type ShortcutId } from "~/stores/shortcuts-store";
import { useIsTauri } from "~/hooks/use-tauri";

function MainContent() {
    return (
        <SidebarInset>
            <TitlebarSpacer />
            <div className="flex flex-1 min-h-0">
                <Outlet />
            </div>
        </SidebarInset>
    );
}

function AppShell() {
    const { toggleSidebar } = useSidebar();
    const { toggleTabBar, cycleTab } = useTabsStore();
    const { addNote } = useNotesStore();
    const { open: openSettings } = useSettingsStore();
    const { bindings } = useShortcutsStore();
    const isTauri = useIsTauri();

    useEffect(() => {
        if (typeof window === "undefined" || !isTauri) return;

        const unlisteners: (() => void)[] = [];

        listen("toggle-sidebar", () => toggleSidebar())
            .then((fn) => unlisteners.push(fn))
            .catch(() => { });

        listen("open-settings", () => openSettings())
            .then((fn) => unlisteners.push(fn))
            .catch(() => { });

        listen("new-note", () => addNote())
            .then((fn) => unlisteners.push(fn))
            .catch(() => { });

        return () => {
            unlisteners.forEach((fn) => fn());
        };
    }, [isTauri, toggleSidebar, openSettings, addNote]);

    // Keyboard shortcut handler
    useEffect(() => {
        if (typeof window === "undefined") return;

        const executeShortcut = (id: ShortcutId) => {
            switch (id) {
                case "toggle-sidebar":
                    toggleSidebar();
                    break;
                case "toggle-tab-bar":
                    toggleTabBar();
                    break;
                case "cycle-tab-forward":
                    cycleTab(1);
                    break;
                case "cycle-tab-backward":
                    cycleTab(-1);
                    break;
                case "new-note":
                    addNote();
                    break;
                case "open-settings":
                    openSettings();
                    break;
            }
        };

        const handleKeyDown = (ev: KeyboardEvent) => {
            const target = ev.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                if (eventMatchesBinding(ev, bindings["open-settings"])) {
                    ev.preventDefault();
                    executeShortcut("open-settings");
                }
                return;
            }

            for (const [id, binding] of Object.entries(bindings)) {
                if (eventMatchesBinding(ev, binding)) {
                    ev.preventDefault();
                    executeShortcut(id as ShortcutId);
                    return;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [bindings, toggleSidebar, toggleTabBar, cycleTab, addNote, openSettings]);

    return (
        <>
            <IconRibbon />
            <AppHeader />
            <AppSidebar />
            <MainContent />
            <SettingsDialogContent />
            <TanStackRouterDevtools position='bottom-right' />
        </>
    );
}

export const Route = createRootRoute({
    component: () => (
        <SidebarProvider>
            <AppShell />
        </SidebarProvider>
    ),
});
