import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { SidebarMenuButton } from "~/ui/sidebar";

import IconSettings from "~icons/lucide/settings";
import IconSun from "~icons/lucide/sun";
import IconMoon from "~icons/lucide/moon";
import IconMonitor from "~icons/lucide/monitor";

import { useSettingsStore } from "~/stores/settings-store";
import { useTheme } from "~/hooks/use-theme";

import { cn } from "~/lib/utils";

type ThemeOptionProps = {
    theme: "light" | "dark" | "system";
    isActive: boolean;
    onClick: () => void;
};

function ThemeOption({ theme, isActive, onClick }: ThemeOptionProps) {
    const Icon = theme === "light" ? IconSun : theme === "dark" ? IconMoon : IconMonitor;
    const label = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex flex-col items-center gap-2.5 p-3 rounded-xl transition-all duration-200",
                "border-2",
                isActive
                    ? "border-foreground bg-accent shadow-sm"
                    : "border-transparent bg-muted/40 hover:bg-muted/70"
            )}
        >
            {/* Visual Preview */}
            <div
                className={cn(
                    "w-16 h-12 rounded-lg overflow-hidden flex items-center justify-center",
                    "border border-border/50 transition-colors",
                    theme === "dark"
                        ? "bg-zinc-900"
                        : theme === "light"
                            ? "bg-white"
                            : "bg-gradient-to-br from-white via-white to-zinc-900"
                )}
            >
                {theme === "light" && (
                    <div className="relative">
                        <div className="size-5 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50" />
                        <div className="absolute -inset-1 rounded-full bg-amber-300/30 blur-sm" />
                    </div>
                )}
                {theme === "dark" && (
                    <div className="relative">
                        <div className="size-4 rounded-full bg-slate-200 shadow-lg shadow-slate-200/40" />
                        <div className="absolute top-0.5 left-1 size-3 rounded-full bg-zinc-900" />
                    </div>
                )}
                {theme === "system" && (
                    <div className="flex w-full h-full">
                        <div className="flex-1 flex items-center justify-center">
                            <div className="size-3 rounded-full bg-amber-400" />
                        </div>
                        <div className="w-px bg-border/60" />
                        <div className="flex-1 bg-zinc-900 flex items-center justify-center">
                            <div className="size-2.5 rounded-full bg-slate-300" />
                        </div>
                    </div>
                )}
            </div>

            {/* Label */}
            <div className="flex items-center gap-1.5">
                <Icon className="size-3.5 text-muted-foreground" />
                <span
                    className={cn(
                        "text-xs font-medium transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                >
                    {label}
                </span>
            </div>

            {/* Active indicator */}
            {isActive && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-foreground rounded-full" />
            )}
        </button>
    );
}

/** Button trigger for sidebar - opens settings dialog */
export function SettingsTrigger() {
    const { open } = useSettingsStore();

    return (
        <SidebarMenuButton tooltip="Settings (⌘,)" onClick={open}>
            <IconSettings className="size-4" />
            <span>Settings</span>
        </SidebarMenuButton>
    );
}

/** Dialog content - render at root level so it shows even when sidebar is closed */
export function SettingsDialogContent() {
    const { theme, setTheme } = useTheme();
    const { isOpen, setOpen } = useSettingsStore();

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base">Settings</DialogTitle>
                    <DialogDescription>
                        Customize your workspace preferences
                    </DialogDescription>
                </DialogHeader>

                {/* Theme Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium">Theme</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Choose your preferred appearance
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <ThemeOption
                            theme="light"
                            isActive={theme === "light"}
                            onClick={() => setTheme("light")}
                        />
                        <ThemeOption
                            theme="dark"
                            isActive={theme === "dark"}
                            onClick={() => setTheme("dark")}
                        />
                        <ThemeOption
                            theme="system"
                            isActive={theme === "system"}
                            onClick={() => setTheme("system")}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
