import { useTabs } from "~/hooks/use-tabs";
import { useSettings } from "~/hooks/use-settings";
import { cn } from "~/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { SidebarMenuButton } from "~/ui/sidebar";

import IconSettings from "~icons/lucide/settings";
import IconLayoutPanelLeft from "~icons/lucide/panel-left";
import IconLayoutPanelTop from "~icons/lucide/panel-top";

type TabLayoutOptionProps = {
    orientation: "horizontal" | "vertical";
    isActive: boolean;
    onClick: () => void;
};

function TabLayoutOption({ orientation, isActive, onClick }: TabLayoutOptionProps) {
    const isVertical = orientation === "vertical";

    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200",
                "border-2",
                isActive
                    ? "border-foreground bg-accent shadow-sm"
                    : "border-transparent bg-muted/40 hover:bg-muted/70"
            )}
        >
            {/* Visual Preview */}
            <div
                className={cn(
                    "w-28 h-20 rounded-lg overflow-hidden",
                    "bg-background border border-border/50",
                    "flex flex-row"
                )}
            >
                {/* Sidebar mock (common for both) */}
                <div className="w-[18px] h-full bg-muted/40 border-r border-border/40 shrink-0" />

                {isVertical ? (
                    <>
                        {/* Vertical Tab bar mock */}
                        <div className="w-[32px] h-full bg-background/50 border-r border-border/40 flex flex-col items-center pt-2 gap-1.5">
                            <div className="bg-foreground/20 rounded-[2px] h-1 w-4" />
                            <div className="bg-foreground/10 rounded-[2px] h-1 w-4" />
                        </div>

                        {/* Content area mock */}
                        <div className="flex-1 p-2 space-y-1.5">
                            <div className="w-8 h-1 bg-foreground/10 rounded-full" />
                            <div className="w-full h-1 bg-foreground/5 rounded-full" />
                            <div className="w-3/4 h-1 bg-foreground/5 rounded-full" />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Horizontal Tab bar mock */}
                        <div className="h-[18px] w-full border-b border-border/40 flex items-center px-1.5 gap-1.5 bg-background/50">
                            <div className="h-1 w-6 rounded-full bg-foreground/20" />
                            <div className="h-1 w-4 rounded-full bg-foreground/5" />
                        </div>
                        {/* Content area mock */}
                        <div className="flex-1 p-2 space-y-1.5">
                            <div className="w-8 h-1 bg-foreground/10 rounded-full" />
                            <div className="w-full h-1 bg-foreground/5 rounded-full" />
                            <div className="w-3/4 h-1 bg-foreground/5 rounded-full" />
                        </div>
                    </div>
                )}
            </div>

            {/* Label */}
            <div className="flex items-center gap-2">
                {isVertical ? (
                    <IconLayoutPanelLeft className="size-4 text-muted-foreground" />
                ) : (
                    <IconLayoutPanelTop className="size-4 text-muted-foreground" />
                )}
                <span
                    className={cn(
                        "text-sm font-medium transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                >
                    {isVertical ? "Vertical" : "Horizontal"}
                </span>
            </div>

            {/* Active indicator */}
            {
                isActive && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-foreground rounded-full" />
                )
            }
        </button >
    );
}

/** Button trigger for sidebar - opens settings dialog */
export function SettingsTrigger() {
    const { open } = useSettings();

    return (
        <SidebarMenuButton tooltip="Settings (⌘,)" onClick={open}>
            <IconSettings className="size-4" />
            <span>Settings</span>
        </SidebarMenuButton>
    );
}

/** Dialog content - render at root level so it shows even when sidebar is closed */
export function SettingsDialogContent() {
    const { orientation, setOrientation } = useTabs();
    const { isOpen, setOpen } = useSettings();

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base">Settings</DialogTitle>
                    <DialogDescription>
                        Customize your workspace preferences
                    </DialogDescription>
                </DialogHeader>

                {/* Tab Layout Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium">Tab Layout</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Choose how tabs are displayed
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <TabLayoutOption
                            orientation="vertical"
                            isActive={orientation === "vertical"}
                            onClick={() => setOrientation("vertical")}
                        />
                        <TabLayoutOption
                            orientation="horizontal"
                            isActive={orientation === "horizontal"}
                            onClick={() => setOrientation("horizontal")}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
