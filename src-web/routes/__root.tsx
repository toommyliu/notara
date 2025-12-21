import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppHeader } from "~/components/layout/app-header";
import { AppSidebar } from "~/components/layout/app-sidebar";
import { TitlebarSpacer } from "~/components/layout/app-titlebar";
import { NotesProvider } from "~/contexts/notes-context";
import { PageHeaderProvider } from "~/contexts/page-header";
import { SidebarInset, SidebarProvider } from "~/ui/sidebar";

export const Route = createRootRoute({
    component: () => (
        <NotesProvider>
            <PageHeaderProvider>
                <SidebarProvider>
                    <AppHeader />
                    <TitlebarSpacer />
                    <AppSidebar />
                    <SidebarInset>
                        <Outlet />
                    </SidebarInset>
                    <TanStackRouterDevtools />
                </SidebarProvider>
            </PageHeaderProvider>
        </NotesProvider>
    ),
});
