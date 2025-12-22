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
                    "w-24 h-16 rounded-lg overflow-hidden",
                    "bg-background border border-border/50",
                    "flex",
                    isVertical ? "flex-row" : "flex-col"
                )}
            >
                {/* Sidebar mock */}
                <div className="w-5 h-full bg-muted/60 border-r border-border/30 shrink-0" />

                {/* Tab bar mock */}
                <div
                    className={cn(
                        "bg-muted/40",
                        isVertical
                            ? "w-4 h-full border-r border-border/30"
                            : "h-2.5 w-full border-b border-border/30"
                    )}
                >
                    <div
                        className={cn(
                            "bg-foreground/20 rounded-sm",
                            isVertical ? "w-2.5 h-2 mt-1 mx-auto" : "w-4 h-1.5 ml-1 mt-0.5"
                        )}
                    />
                </div>

                {/* Content area mock */}
                <div className="flex-1 p-1">
                    <div className="w-full h-1 bg-muted/50 rounded-full mb-0.5" />
                    <div className="w-3/4 h-1 bg-muted/30 rounded-full" />
                </div>
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
            {isActive && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-foreground rounded-full" />
            )}
        </button>
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
