import type { PropsWithChildren, MouseEvent } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { cn } from "~/lib/utils";
import { usePlatformLayout } from "~/hooks/use-platform";

type AppTitlebarProps = PropsWithChildren<{ className?: string }>;

const INTERACTIVE_ELEMENTS = ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"];

export function AppTitlebar({ children, className }: AppTitlebarProps) {
    const layout = usePlatformLayout();

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;

        const isInteractive =
            INTERACTIVE_ELEMENTS.includes(target.tagName) ||
            target.closest("button, a, input, textarea, select, [role='button'], [contenteditable]");

        if (!isInteractive) {
            e.preventDefault();
            getCurrentWindow().startDragging();
        }
    };

    return (
        <div
            className={cn("fixed inset-x-0 top-0 z-50 flex items-center", className)}
            style={{
                height: layout.titlebarHeight,
                paddingLeft: layout.leftInset,
                paddingRight: layout.rightInset,
            }}
            onMouseDown={handleMouseDown}
            data-tauri-drag-region
        >
            {children}
        </div>
    );
}

export function TitlebarSpacer() {
    const layout = usePlatformLayout();
    return <div className="shrink-0" style={{ height: layout.titlebarHeight }} />;
}
