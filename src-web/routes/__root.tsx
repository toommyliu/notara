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
    const isTauri = useIsTauri();

    useEffect(() => {
        if (typeof window === "undefined") return;

        let unlisten: (() => void) | undefined;

        if (isTauri) {
            listen("toggle-sidebar", () => toggleSidebar())
                .then((fn) => {
                    unlisten = fn;
                })
                .catch(() => {
                });
        }

        return () => {
            unlisten?.();
        };
    }, [isTauri, toggleSidebar]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleKeyDown = (ev: KeyboardEvent) => {
            if (!(ev.metaKey || ev.ctrlKey)) return;

            if (ev.key === "Tab") {
                ev.preventDefault();
                cycleTab(ev.shiftKey ? -1 : 1);
                return;
            }

            if (ev.key === "\\") {
                ev.preventDefault();
                toggleSidebar();
                return;
            }

            if (ev.key.toLowerCase() === "b") {
                ev.preventDefault();
                toggleTabBar();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isTauri, toggleSidebar, toggleTabBar, cycleTab]);

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

