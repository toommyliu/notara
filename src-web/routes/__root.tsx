import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppHeader } from "~/components/layout/app-header";
import { AppSidebar } from "~/components/layout/app-sidebar";
import { TabBar } from "~/components/layout/tab-bar";
import { TitlebarSpacer } from "~/components/layout/app-titlebar";
import { SettingsDialogContent } from "~/components/settings-dialog";
import { SidebarInset, SidebarProvider } from "~/ui/sidebar";

import { NotesProvider } from "~/contexts/notes-context";
import { PageHeaderProvider } from "~/contexts/page-header";
import { SettingsProvider } from "~/contexts/settings-context";
import { TabsProvider } from "~/contexts/tabs-context";

import { useTabs } from "~/hooks/use-tabs";

function MainContent() {
    const { orientation, pinnedTabs, openTabs } = useTabs();
    const hasTabs = pinnedTabs.length > 0 || openTabs.length > 0;
    const isVertical = orientation === "vertical";

    return (
        <SidebarInset>
            <TitlebarSpacer />
            {!isVertical && hasTabs && <TabBar />}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {isVertical && hasTabs && <TabBar />}
                <Outlet />
            </div>
        </SidebarInset>
    );
}

export const Route = createRootRoute({
    component: () => (
        <NotesProvider>
            <TabsProvider>
                <SettingsProvider>
                    <PageHeaderProvider>
                        <SidebarProvider>
                            <AppHeader />
                            <AppSidebar />
                            <MainContent />
                            <SettingsDialogContent />
                            <TanStackRouterDevtools />
                        </SidebarProvider>
                    </PageHeaderProvider>
                </SettingsProvider>
            </TabsProvider>
        </NotesProvider>
    ),
});
