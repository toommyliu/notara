import { useLocation, Link } from '@tanstack/react-router';

import { SidebarTrigger } from '~/ui/sidebar';
import { AppTitlebar } from './app-titlebar';
import { HeaderTabs } from './header-tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/ui/tooltip';
import { Avatar, AvatarFallback } from '~/ui/avatar';

import IconLock from '~icons/lucide/lock';
import IconFiles from '~icons/lucide/folder-open';
import IconSearch from '~icons/lucide/search';
import IconStar from '~icons/lucide/star';
import IconSettings from '~icons/lucide/settings';

import { usePageHeaderStore } from '~/features/layout/stores/page-header-store';
import { useTabsStore } from '~/features/layout/stores/tabs-store';
import { usePlatformLayout } from '~/hooks/use-platform';
import { useSettingsStore } from '~/features/settings/';

import { cn } from '~/lib/utils';

interface HeaderIconTabProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  to?: string;
}

function HeaderIconTab({ icon, label, isActive, onClick, to }: HeaderIconTabProps) {
  const content = (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center p-1.5 rounded-md transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        isActive && "text-foreground bg-muted/80 shadow-sm"
      )}
    >
      {icon}
    </button>
  );

  if (to) {
    return (
      <Tooltip>
        <TooltipTrigger render={
          <Link to={to} className="flex">{content}</Link>
        } />
        <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger render={content} />
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

export function AppHeader() {
  const layout = usePlatformLayout();
  const location = useLocation();
  const { config } = usePageHeaderStore();
  const { title, emoji, isPrivate, actions } = config;
  const { isTabBarVisible, pinnedTabs, openTabs } = useTabsStore();
  const { open } = useSettingsStore();

  const showTabs =
    isTabBarVisible && (pinnedTabs.length > 0 || openTabs.length > 0);

  const hasTrafficLights = layout.isMac && !layout.isFullscreen;

  return (
    <AppTitlebar
      className="border-b border-border/40 overscroll-none select-none"
      noLeftInset={true}
    >
      {/* Left side actions */}
      <div className="flex items-center w-full h-full gap-0.5">
        <div
          className="flex items-center h-full py-2 border-r border-border/40 bg-sidebar pointer-events-auto"
          style={{
             minWidth: "var(--sidebar-width)",
             maxWidth: "var(--sidebar-width)",
             width: "var(--sidebar-width)",
             paddingLeft: hasTrafficLights ? (layout.isMac ? 80 : 12) : 12,
             paddingRight: 4
          }}
        >
          <div className="flex items-center gap-1 flex-1">
             <HeaderIconTab
               icon={<IconFiles className="size-4" />}
               label="Files"
               to="/notes"
               isActive={location.pathname.startsWith('/notes')}
             />
             <HeaderIconTab
               icon={<IconSearch className="size-4" />}
               label="Search"
             />
             <HeaderIconTab
               icon={<IconStar className="size-4" />}
               label="Starred"
             />
          </div>
        </div>

        <div className="flex items-center h-full min-w-0 flex-1 pl-2">
          <HeaderTabs />
        </div>

        {!showTabs && (emoji || title) && (
          <div className="flex items-center gap-2 shrink-0 mr-2">
            {emoji && <span className="text-base shrink-0">{emoji}</span>}
            {title && (
              <span className="truncate font-medium text-sm max-w-[150px]">
                {title}
              </span>
            )}
            {isPrivate && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground/70 shrink-0">
                <IconLock className="size-3" />
                <span className="hidden sm:inline">Private</span>
              </div>
            )}
          </div>
        )}

        {actions && (
          <div className="flex items-center gap-0.5 shrink-0">
            {actions}
          </div>
        )}

        {/* Right-side actions */}
        <div className="flex items-center gap-1 shrink-0 pr-3 pl-2">
          <Tooltip>
            <TooltipTrigger render={
              <button
                className="flex items-center justify-center p-1.5 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={() => open()}
              >
                <IconSettings className="size-4" />
              </button>
            } />
            <TooltipContent side="bottom" className="text-xs">Settings</TooltipContent>
          </Tooltip>

          <SidebarTrigger />

          <Tooltip>
            <TooltipTrigger render={
              <Avatar size="sm" className="cursor-pointer transition-transform hover:scale-105">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            } />
            <TooltipContent side="bottom" className="text-xs">Account</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </AppTitlebar>
  );
}
