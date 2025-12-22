import { AppTitlebar } from "./app-titlebar";
import { HeaderTabs } from "./header-tabs";
import { SidebarTrigger } from "~/ui/sidebar";
import { Separator } from "~/ui/separator";

import IconLock from "~icons/lucide/lock";

import { usePageHeaderContext } from "~/hooks/use-page-header";
import { useTabs } from "~/hooks/use-tabs";

export function AppHeader() {
    const { config } = usePageHeaderContext();
    const { title, emoji, isPrivate, actions } = config;
    const { isTabBarVisible, pinnedTabs, openTabs } = useTabs();

    const showTabs = isTabBarVisible && (pinnedTabs.length > 0 || openTabs.length > 0);

    return (
        <AppTitlebar className="border-b border-border/40 overscroll-none">
            <div className="flex items-center w-full h-full gap-1 overflow-hidden">
                <div className="flex items-center shrink-0">
                    <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
                </div>

                <Separator
                    orientation="vertical"
                    className="mx-2 h-4 self-center"
                />

                <div className="flex items-center h-full">
                    <HeaderTabs />
                </div>

                <div className="flex-1 min-w-0" />

                {!showTabs && (emoji || title) && (
                    <div className="flex items-center gap-2 shrink-0 mr-2">
                        {emoji && <span className="text-base shrink-0">{emoji}</span>}
                        {title && <span className="truncate font-medium text-sm max-w-[150px]">{title}</span>}
                        {isPrivate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground/70 shrink-0">
                                <IconLock className="size-3" />
                                <span className="hidden sm:inline">Private</span>
                            </div>
                        )}
                    </div>
                )}

                {actions && (
                    <div className="flex items-center gap-0.5 shrink-0 pr-2">
                        {actions}
                    </div>
                )}
            </div>
        </AppTitlebar>
    );
}
