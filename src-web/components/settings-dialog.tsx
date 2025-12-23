import { useState, useEffect, useCallback } from "react";
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
import IconKeyboard from "~icons/lucide/keyboard";
import IconRotateCcw from "~icons/lucide/rotate-ccw";
import IconPalette from "~icons/lucide/palette";

import { useSettingsStore } from "~/stores/settings-store";
import { useTheme } from "~/hooks/use-theme";
import { useShortcutsStore, formatBindingForDisplay } from "~/stores/shortcuts-store";
import {
    SHORTCUT_LABELS,
    type ShortcutId,
    type ShortcutBinding,
    type Modifier,
} from "@notara/shortcuts";

import { cn } from "~/lib/utils";

type SettingsTab = "general" | "shortcuts";

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
            <div
                className={cn(
                    "w-16 h-12 rounded-lg overflow-hidden flex items-center justify-center",
                    "border border-border/50 transition-colors",
                    theme === "dark"
                        ? "bg-zinc-900"
                        : theme === "light"
                            ? "bg-white"
                            : "bg-linear-to-br from-white via-white to-zinc-900"
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

            {isActive && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-foreground rounded-full" />
            )}
        </button>
    );
}

type ShortcutRowProps = {
    id: ShortcutId;
    binding: ShortcutBinding;
    isRecording: boolean;
    onStartRecording: () => void;
    onCancelRecording: () => void;
};

function ShortcutRow({ id, binding, isRecording, onStartRecording, onCancelRecording }: ShortcutRowProps) {
    const { setBinding } = useShortcutsStore();

    useEffect(() => {
        if (!isRecording) return;

        const handleKeyDown = (ev: KeyboardEvent) => {
            ev.preventDefault();
            ev.stopPropagation();

            // Escape cancels recording
            if (ev.key === "Escape") {
                onCancelRecording();
                return;
            }

            // Ignore modifier-only presses
            if (["Meta", "Control", "Shift", "Alt"].includes(ev.key)) {
                return;
            }

            const modifiers: Modifier[] = [];
            if (ev.metaKey) modifiers.push("meta");
            if (ev.ctrlKey) modifiers.push("ctrl");
            if (ev.shiftKey) modifiers.push("shift");
            if (ev.altKey) modifiers.push("alt");

            // Require at least one modifier for most keys
            const isFunctionKey = /^F([1-9]|1[0-2])$/.test(ev.key);
            if (modifiers.length === 0 && !isFunctionKey) {
                return;
            }

            // Handle "Dead" keys from Option+letter on macOS
            let key = ev.key;
            if (key === "Dead" && ev.code) {
                const letterMatch = ev.code.match(/^Key([A-Z])$/);
                if (letterMatch) {
                    key = letterMatch[1].toLowerCase();
                } else {
                    const digitMatch = ev.code.match(/^Digit([0-9])$/);
                    if (digitMatch) {
                        key = digitMatch[1];
                    }
                }
            }

            // Still "Dead" after processing? Skip it
            if (key === "Dead") {
                return;
            }

            setBinding(id, { key, modifiers });
            onCancelRecording();
        };

        window.addEventListener("keydown", handleKeyDown, true);
        return () => window.removeEventListener("keydown", handleKeyDown, true);
    }, [isRecording, id, setBinding, onCancelRecording]);

    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">{SHORTCUT_LABELS[id]}</span>
            <button
                onClick={isRecording ? onCancelRecording : onStartRecording}
                className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    "border shadow-sm",
                    isRecording
                        ? "bg-accent border-foreground/20 text-foreground animate-pulse"
                        : "bg-muted/60 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
            >
                {isRecording ? "Press shortcut..." : formatBindingForDisplay(binding)}
            </button>
        </div>
    );
}

function GeneralTab() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div>
                    <h3 className="text-sm font-medium">Theme</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Choose your preferred appearance
                    </p>
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
        </div>
    );
}

function ShortcutsTab() {
    const { bindings, resetToDefaults } = useShortcutsStore();
    const [recordingId, setRecordingId] = useState<ShortcutId | null>(null);

    const handleStartRecording = useCallback((id: ShortcutId) => {
        setRecordingId(id);
    }, []);

    const handleCancelRecording = useCallback(() => {
        setRecordingId(null);
    }, []);

    const shortcutIds = Object.keys(bindings) as ShortcutId[];

    return (
        <div className="space-y-3">
            <div className="bg-muted/30 rounded-xl p-3 border border-border/40">
                <div className="divide-y divide-border/40">
                    {shortcutIds.map((id) => (
                        <ShortcutRow
                            key={id}
                            id={id}
                            binding={bindings[id]}
                            isRecording={recordingId === id}
                            onStartRecording={() => handleStartRecording(id)}
                            onCancelRecording={handleCancelRecording}
                        />
                    ))}
                </div>

                <button
                    onClick={() => {
                        resetToDefaults();
                        setRecordingId(null);
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                    <IconRotateCcw className="size-3.5" />
                    Reset to Defaults
                </button>
            </div>
        </div>
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
    const { isOpen, setOpen } = useSettingsStore();
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");

    const tabs: { id: SettingsTab; label: string; icon: typeof IconPalette }[] = [
        { id: "general", label: "General", icon: IconPalette },
        { id: "shortcuts", label: "Shortcuts", icon: IconKeyboard },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-base">Settings</DialogTitle>
                    <DialogDescription>
                        Customize your workspace preferences
                    </DialogDescription>
                </DialogHeader>

                {/* Tab Bar */}
                <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
                                    activeTab === tab.id
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="size-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto py-2">
                    {activeTab === "general" && <GeneralTab />}
                    {activeTab === "shortcuts" && <ShortcutsTab />}
                </div>
            </DialogContent>
        </Dialog>
    );
}
