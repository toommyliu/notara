import { useState, useEffect, useCallback } from "react";

import IconRotateCcw from "~icons/lucide/rotate-ccw";

import { useShortcutsStore, formatBindingForDisplay } from "~/stores/shortcuts-store";
import {
    SHORTCUT_LABELS,
    type ShortcutId,
    type ShortcutBinding,
    type Modifier,
} from "@notara/shortcuts";

import { cn } from "~/lib/utils";

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

            // TODO:

            // let key = ev.key;
            // if (key === "Dead" && ev.code) {
            //     const letterMatch = ev.code.match(/^Key([A-Z])$/);
            //     if (letterMatch) {
            //         key = letterMatch[1].toLowerCase();
            //     } else {
            //         const digitMatch = ev.code.match(/^Digit([0-9])$/);
            //         if (digitMatch) {
            //             key = digitMatch[1];
            //         }
            //     }
            // }

            // // Still "Dead" after processing? Skip it
            // if (key === "Dead") {
            //     return;
            // }

            // setBinding(id, { key, modifiers });
            // onCancelRecording();
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

export function ShortcutsTab() {
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
