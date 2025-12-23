import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback, type CSSProperties, type Dispatch, type SetStateAction } from "react";

import { BlockEditor } from "~/components/editor/block-editor";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { useSidebar } from "~/components/ui/sidebar";
import { SplitViewContainer } from "~/components/layout/split-view-container";
import { Button } from "~/ui/button";

import IconMoreHorizontal from "~icons/lucide/more-horizontal";
import IconStar from "~icons/lucide/star";
import IconArrowLeftRight from "~icons/lucide/arrow-left-right";
import IconX from "~icons/lucide/x";

import { useNotesStore, type Block } from "~/stores/notes-store";
import { useTabsStore } from "~/stores/tabs-store";
import { useSplitViewStore, useIsSplitView } from "~/stores/split-view-store";
import { usePageHeaderStore } from "~/stores/page-header-store";

import { cn } from "~/lib/utils";

export const Route = createFileRoute("/notes")({
    component: NotesPage,
});

const EDITOR_PADDING_STORAGE_KEY = "notara:editor:padding";

const PADDING_PRESETS = {
    wide: { label: "Wide", px: 16 },
    comfortable: { label: "Comfortable", px: 32 },
    default: { label: "Default", px: 48 },
    compact: { label: "Compact", px: 64 },
};

type PaddingPresetKey = keyof typeof PADDING_PRESETS;
type PaddingPrefs = {
    expanded: PaddingPresetKey;
    collapsed: PaddingPresetKey;
};

const DEFAULT_PADDING_PREFS: PaddingPrefs = {
    expanded: "default",
    collapsed: "default",
};

function isPaddingPresetKey(value: string): value is PaddingPresetKey {
    return value in PADDING_PRESETS;
}

function NotesPage() {
    const { notes, updateNote } = useNotesStore();
    const { activeTabId } = useTabsStore();
    const { panes, activePaneId, openInPane } = useSplitViewStore();
    const isSplitView = useIsSplitView();
    const { state: sidebarState } = useSidebar();
    const [paddingPrefs, setPaddingPrefs] = useState<PaddingPrefs>(DEFAULT_PADDING_PREFS);

    // For single-pane mode, sync activeTabId to the pane
    useEffect(() => {
        if (!isSplitView && activeTabId) {
            const singlePane = panes[0];
            if (singlePane && singlePane.noteId !== activeTabId) {
                openInPane(singlePane.id, activeTabId);
            }
        }
    }, [activeTabId, isSplitView, panes, openInPane]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(EDITOR_PADDING_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<PaddingPrefs>;
                setPaddingPrefs((prev) => ({
                    expanded: isPaddingPresetKey(parsed.expanded ?? "") ? parsed.expanded! : prev.expanded,
                    collapsed: isPaddingPresetKey(parsed.collapsed ?? "") ? parsed.collapsed! : prev.collapsed,
                }));
            }
        } catch (error) {
            console.error("Failed to load padding preferences", error);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(EDITOR_PADDING_STORAGE_KEY, JSON.stringify(paddingPrefs));
    }, [paddingPrefs]);

    // Get note for the active pane (for header)
    const activePane = panes.find(p => p.id === activePaneId);
    const activePaneNote = activePane?.noteId ? notes.get(activePane.noteId) ?? null : null;

    const actions = useMemo(() => (
        <>
            <NotePaddingControl
                presets={PADDING_PRESETS}
                prefs={paddingPrefs}
                onChange={setPaddingPrefs}
            />
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground size-7">
                <IconStar className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground size-7">
                <IconMoreHorizontal className="size-3.5" />
            </Button>
        </>
    ), [paddingPrefs]);

    const setConfig = usePageHeaderStore((s) => s.setConfig);

    // Set page header config
    useEffect(() => {
        setConfig({
            title: activePaneNote?.title ?? "Untitled",
            emoji: activePaneNote?.emoji ?? "📝",
            isPrivate: true,
            actions,
        });

        return () => setConfig({});
    }, [activePaneNote?.title, activePaneNote?.emoji, actions, setConfig]);

    const activePadding = PADDING_PRESETS[paddingPrefs[sidebarState]] ?? PADDING_PRESETS.default;
    const editorPaddingStyle = {
        paddingLeft: `${activePadding.px}px`,
        paddingRight: `${activePadding.px}px`,
    } satisfies CSSProperties;

    const handleTitleChange = (noteId: string, newTitle: string) => {
        updateNote(noteId, { title: newTitle });
    };

    return (
        <SplitViewContainer
            contentPadding={activePadding.px}
            renderPane={(pane, isActive) => (
                <NoteView
                    key={pane.id}
                    paneId={pane.id}
                    noteId={pane.noteId}
                    isActive={isActive}
                    editorPaddingStyle={editorPaddingStyle}
                    onTitleChange={handleTitleChange}
                />
            )}
        />
    );
}

type NoteViewProps = {
    paneId: string;
    noteId: string | null;
    isActive: boolean;
    editorPaddingStyle: CSSProperties;
    onTitleChange: (noteId: string, title: string) => void;
};

function NoteView({ paneId, noteId, editorPaddingStyle, onTitleChange }: NoteViewProps) {
    const { notes, updateNote } = useNotesStore();
    const { removePane } = useSplitViewStore();
    const isSplitView = useIsSplitView();
    const note = noteId ? notes.get(noteId) ?? null : null;
    const titleRef = useRef<HTMLHeadingElement>(null);

    // Update the displayed title when the note changes
    useEffect(() => {
        if (titleRef.current && note) {
            titleRef.current.textContent = note.title;
        }
    }, [note?.id, note?.title]);

    const handleContentChange = useCallback((blocks: Block[]) => {
        if (note) {
            updateNote(note.id, { content: blocks });
        }
    }, [note?.id, updateNote]);

    if (!note) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                    <p className="text-lg">No note selected</p>
                    <p className="text-sm mt-1">Select a note from the sidebar or create a new one</p>
                    {isSplitView && (
                        <button
                            onClick={() => removePane(paneId)}
                            className="mt-4 text-xs flex items-center gap-1 mx-auto text-muted-foreground/60 hover:text-foreground transition-colors"
                        >
                            <IconX className="size-3" />
                            Close pane
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <main className="flex-1 h-full min-h-0 overflow-y-auto scrollbar-custom flex flex-col items-center">
            <div className="w-full max-w-3xl py-16 transition-all duration-500 ease-in-out" style={editorPaddingStyle}>
                <div className="flex justify-start mb-4">
                    <button className="text-7xl hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors">
                        {note.emoji}
                    </button>
                </div>

                <h1
                    key={note.id}
                    ref={titleRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(ev) => onTitleChange(note.id, ev.currentTarget.textContent || "")}
                    onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === "Tab") {
                            ev.preventDefault();

                            // Focus the first editable block in the editor
                            const editorContainer = document.querySelector('[data-block-editor]');
                            const firstBlock = editorContainer?.querySelector('[contenteditable="true"]') as HTMLElement;
                            firstBlock?.focus();
                        }
                    }}
                    data-placeholder="Untitled"
                    className={cn(
                        "text-4xl font-bold mb-1 leading-tight",
                        "outline-none",
                        "empty:before:content-[attr(data-placeholder)]",
                        "empty:before:text-muted-foreground/40"
                    )}
                />

                <div className="mt-4" data-block-editor>
                    <BlockEditor
                        key={note.id}
                        initialBlocks={note.content}
                        onChange={handleContentChange}
                    />
                </div>
            </div>
        </main>
    );
}

type NotePaddingControlProps = {
    presets: typeof PADDING_PRESETS;
    prefs: PaddingPrefs;
    onChange: Dispatch<SetStateAction<PaddingPrefs>>;
};

function NotePaddingControl({ presets, prefs, onChange }: NotePaddingControlProps) {
    const { state: sidebarState } = useSidebar();
    const presetEntries = Object.entries(presets) as [PaddingPresetKey, { label: string; px: number }][];

    const currentValue = prefs[sidebarState];

    const handlePresetSelect = (key: PaddingPresetKey) => {
        onChange({ expanded: key, collapsed: key });
    };

    return (
        <Popover>
            <PopoverTrigger>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground size-7"
                >
                    <IconArrowLeftRight className="size-3.5" />
                    <span className="sr-only">Page width</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="w-48 p-2 gap-1">
                <p className="text-[11px] text-muted-foreground px-2 pb-1.5">
                    Page width
                </p>

                {/* Visual Width Presets - horizontal bars showing content width */}
                <div className="space-y-0.5">
                    {presetEntries.map(([key, preset]) => {
                        const isActive = currentValue === key;
                        // Scale based on padding: less padding = wider bar (16px = 88%, 64px = 52%)
                        const widthPercent = Math.max(50, 100 - preset.px * 0.75);

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handlePresetSelect(key)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors duration-150",
                                    "hover:bg-muted/60",
                                    isActive && "bg-muted"
                                )}
                            >
                                {/* Visual page width bar */}
                                <div className="flex-1 h-4 rounded-sm bg-muted/50 flex items-center justify-center overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-2.5 rounded-[2px] transition-all duration-200",
                                            isActive
                                                ? "bg-foreground"
                                                : "bg-muted-foreground/30"
                                        )}
                                        style={{ width: `${widthPercent}%` }}
                                    />
                                </div>
                                {/* Label */}
                                <span
                                    className={cn(
                                        "text-xs min-w-[70px] text-right transition-colors duration-150",
                                        isActive
                                            ? "text-foreground font-medium"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {preset.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}