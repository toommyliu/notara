import type { PropsWithChildren } from "react";

import { cn } from "~/lib/utils";

import { usePlatformLayout } from "~/hooks/use-platform";

type AppTitlebarProps = PropsWithChildren<{ className?: string; noLeftInset?: boolean }>;

export function AppTitlebar({ children, className, noLeftInset }: AppTitlebarProps) {
    const layout = usePlatformLayout();

    return (
        <div
            className={cn("fixed inset-x-0 top-0 z-50 flex items-center select-none bg-sidebar", className)}
            style={{
                height: layout.titlebarHeight,
                paddingLeft: noLeftInset ? 0 : layout.leftInset,
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
