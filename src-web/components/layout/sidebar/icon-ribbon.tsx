import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from 'react';

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip";

import IconSettings from "~icons/lucide/settings";
import IconHome from "~icons/lucide/home";
import IconSearch from "~icons/lucide/search";
import IconFiles from "~icons/lucide/folder-open";
import IconStar from "~icons/lucide/star";

import { useSettingsStore } from "~/stores/settings-store";
import { usePlatformLayout } from "~/hooks/use-platform";

import { cn } from "~/lib/utils";

type RibbonIconProps = {
    icon: ReactNode;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
    to?: string;
};

function RibbonIcon({ icon, label, isActive, onClick, to }: RibbonIconProps) {
    const content = (
        <button
            onClick={onClick}
            className={cn(
                "relative flex items-center justify-center size-9 rounded-md",
                "text-muted-foreground/70 hover:text-foreground",
                "transition-all duration-150 ease-out",
                "hover:bg-muted/50",
                isActive && "text-foreground bg-muted/60",
                // Active indicator bar on left
                // isActive && "before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-foreground/80 before:rounded-full"
            )}
            aria-label={label}
        >
            {icon}
        </button>
    );

    const wrapped = to ? (
        <Link to={to} className="flex">
            {content}
        </Link>
    ) : (
        content
    );

    return (
        <Tooltip>
            <TooltipTrigger render={wrapped} />
            <TooltipContent side="right" sideOffset={8}>
                {label}
            </TooltipContent>
        </Tooltip>
    );
}

export function IconRibbon() {
    const layout = usePlatformLayout();
    const location = useLocation();
    const { open } = useSettingsStore();

    const isHome = location.pathname === "/";

    return (
        <div
            className={cn(
                "fixed left-0 bottom-0 z-50",
                "flex flex-col items-center w-12 shrink-0",
                "bg-sidebar border-r border-border/40",
                "gap-1",
                "select-none"
            )}
            style={{
                top: 0,
                paddingTop: layout.titlebarHeight + (layout.isMac && !layout.isFullscreen ? 8 : 2),
                paddingBottom: 8,
            }}
            data-tauri-drag-region
        >
            <div className="flex flex-col items-center gap-0.5">
                <RibbonIcon
                    icon={<IconHome className="size-[18px]" />}
                    label="Home"
                    to="/"
                    isActive={isHome}
                />
                <RibbonIcon
                    icon={<IconSearch className="size-[18px]" />}
                    label="Search"
                />
                <RibbonIcon
                    icon={<IconFiles className="size-[18px]" />}
                    label="Files"
                    to="/notes"
                    isActive={!isHome}
                />
                <RibbonIcon
                    icon={<IconStar className="size-[18px]" />}
                    label="Starred"
                />
            </div>

            <div className="flex-1" />

            <div className="flex flex-col items-center gap-0.5">
                <RibbonIcon
                    icon={<IconSettings className="size-[18px]" />}
                    label="Settings"
                    onClick={open}
                />
            </div>
        </div>
    );
}
