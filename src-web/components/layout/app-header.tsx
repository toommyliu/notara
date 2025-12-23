import { AppTitlebar } from "./app-titlebar";
import { HeaderTabs } from "./header-tabs";
import { SidebarTrigger } from "~/ui/sidebar";
import { Separator } from "~/ui/separator";

import IconLock from "~icons/lucide/lock";

import { usePageHeaderStore } from "~/stores/page-header-store";
import { useTabsStore } from "~/stores/tabs-store";

export function AppHeader() {
    const { config } = usePageHeaderStore();
    const { title, emoji, isPrivate, actions } = config;
    const { isTabBarVisible, pinnedTabs, openTabs } = useTabsStore();

    const showTabs = isTabBarVisible && (pinnedTabs.length > 0 || openTabs.length > 0);

    return (
        <AppTitlebar className="border-b border-border/40 overscroll-none select-none">
            <div className="flex items-center w-full h-full gap-0.5">
                <div className="flex items-center shrink-0 pl-1">
                    <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
                </div>

                <Separator
                    orientation="vertical"
                    className="mx-1 h-3.5! self-center! bg-linear-to-b from-transparent via-border/60 to-transparent"
                />

                <div className="flex items-center h-full min-w-0 flex-1">
                    <HeaderTabs />
                </div>

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
