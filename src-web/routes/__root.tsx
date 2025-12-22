import { useEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { listen } from "@tauri-apps/api/event";

import { AppHeader } from "~/components/layout/app-header";
import { AppSidebar } from "~/components/layout/app-sidebar";
import { TabBar } from "~/components/layout/tab-bar";
import { TitlebarSpacer } from "~/components/layout/app-titlebar";
import { SettingsDialogContent } from "~/components/settings-dialog";
import { SidebarInset, SidebarProvider, useSidebar } from "~/ui/sidebar";

import { NotesProvider } from "~/contexts/notes-context";
import { PageHeaderProvider } from "~/contexts/page-header";
import { SettingsProvider } from "~/contexts/settings-context";
import { TabsProvider } from "~/contexts/tabs-context";

import { useTabs } from "~/hooks/use-tabs";
import { useIsTauri } from "~/hooks/use-tauri";

function MainContent() {
    const { orientation, pinnedTabs, openTabs, isTabBarVisible } = useTabs();
    const hasTabs = pinnedTabs.length > 0 || openTabs.length > 0;
    const isVertical = orientation === "vertical";
    const showVerticalTabs = hasTabs && isTabBarVisible && isVertical;

    return (
        <SidebarInset className="overflow-hidden">
            <TitlebarSpacer />
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {showVerticalTabs && <TabBar />}
                <Outlet />
            </div>
        </SidebarInset>
    );
}

function AppShell() {
    const { toggleSidebar } = useSidebar();
    const { toggleTabBar } = useTabs();
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
    }, [isTauri, toggleSidebar, toggleTabBar]);

    return (
        <>
            <AppHeader />
            <AppSidebar />
            <MainContent />
            <SettingsDialogContent />
            <TanStackRouterDevtools />
        </>
    );
}

export const Route = createRootRoute({
    component: () => (
        <NotesProvider>
            <TabsProvider>
                <SettingsProvider>
                    <PageHeaderProvider>
                        <SidebarProvider>
                            <AppShell />
                        </SidebarProvider>
                    </PageHeaderProvider>
                </SettingsProvider>
            </TabsProvider>
        </NotesProvider>
    ),
});
