import type { PropsWithChildren } from "react";

import { cn } from "~/lib/utils";

import { usePlatformLayout } from "~/hooks/use-platform";

type AppTitlebarProps = PropsWithChildren<{ className?: string }>;

export function AppTitlebar({ children, className }: AppTitlebarProps) {
    const layout = usePlatformLayout();

    return (
        <div
            className={cn("fixed inset-x-0 top-0 z-50 flex items-center select-none", className)}
            style={{
                height: layout.titlebarHeight,
                paddingLeft: layout.leftInset,
                paddingRight: layout.rightInset,
            }}
            data-tauri-drag-region
        >
            <div className="pointer-events-none h-full w-full flex items-center">
                {children}
            </div>
        </div>
    );
}

export function TitlebarSpacer() {
    const layout = usePlatformLayout();
    return <div className="shrink-0" style={{ height: layout.titlebarHeight }} />;
}
