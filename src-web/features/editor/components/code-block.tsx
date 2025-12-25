import {
    useState, useEffect, useCallback, forwardRef, memo, useMemo, useRef, useImperativeHandle,
} from "react";
import type { ChangeEvent, KeyboardEvent, ClipboardEvent, UIEvent } from "react";
import { codeToHtml, bundledLanguages } from "shiki";

import IconCopy from "~icons/lucide/copy";
import IconCheck from "~icons/lucide/check";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconWrapText from "~icons/lucide/wrap-text";
import IconHash from "~icons/lucide/hash";

import { useTheme } from "~/hooks/use-theme";
import { cn } from "~/lib/utils";

export type CodeBlockRef = {
    focus: () => void;
    focusStart: () => void;
    focusEnd: () => void;
    getText: () => string;
    clear: () => void;
};

const POPULAR_LANGUAGES = [
    "typescript", "javascript", "python", "rust", "go", "html", "css",
    "json", "yaml", "markdown", "bash", "sql", "tsx", "jsx", "swift",
    "kotlin", "java", "c", "cpp", "csharp",
] as const;

type CodeBlockProps = {
    content: string;
    language?: string;
    onLanguageChange?: (language: string) => void;
    onContentChange?: (content: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onEnter?: () => void;
    onNavigatePrev?: (type: "up" | "left") => void;
    onNavigateNext?: (type: "down" | "right") => void;
    blockId?: string;
    isSelected?: boolean;
};

export const CodeBlock = memo(forwardRef<CodeBlockRef, CodeBlockProps>(
    function CodeBlock(
        {
            content,
            language = "plaintext",
            onLanguageChange,
            onContentChange,
            onFocus,
            onBlur,
            onEnter,
            onNavigatePrev,
            onNavigateNext,
            blockId,
            isSelected,
        },
        ref
    ) {
        const [copied, setCopied] = useState(false);
        const [showLanguageMenu, setShowLanguageMenu] = useState(false);
        const [languageSearch, setLanguageSearch] = useState("");
        const [highlightedHtml, setHighlightedHtml] = useState<string>("");
        const [editContent, setEditContent] = useState(content);
        const [wordWrap, setWordWrap] = useState(true);
        const [showLineNumbers, setShowLineNumbers] = useState(true);

        const codeContainerRef = useRef<HTMLDivElement>(null);
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const lineNumbersRef = useRef<HTMLDivElement>(null);

        const { resolvedTheme } = useTheme();

        const languages = useMemo(() => {
            const allLangs = Object.keys(bundledLanguages);
            const popular = POPULAR_LANGUAGES.filter(l => allLangs.includes(l));
            const others = allLangs.filter(l => !POPULAR_LANGUAGES.includes(l as typeof POPULAR_LANGUAGES[number])).sort();
            return [...popular, ...others];
        }, []);

        const lines = useMemo(() => editContent.split("\n"), [editContent]);
        const lineCount = lines.length;

        useEffect(() => {
            setEditContent(content);
        }, [content]);

        useEffect(() => {
            const highlight = async () => {
                if (!editContent.trim()) {
                    setHighlightedHtml("");
                    return;
                }

                try {
                    let html = await codeToHtml(editContent, {
                        lang: language || "plaintext",
                        theme: resolvedTheme === "dark" ? "github-dark" : "github-light",
                    });
                    html = html.replace(/>\n</g, "><");
                    setHighlightedHtml(html);
                } catch {
                    setHighlightedHtml("");
                }
            };

            highlight();
        }, [editContent, language, resolvedTheme]);

        const handleScroll = useCallback((ev: UIEvent<HTMLTextAreaElement>) => {
            const textarea = ev.currentTarget;
            if (codeContainerRef.current) {
                codeContainerRef.current.scrollTop = textarea.scrollTop;
                codeContainerRef.current.scrollLeft = textarea.scrollLeft;
            }
            if (lineNumbersRef.current) {
                lineNumbersRef.current.scrollTop = textarea.scrollTop;
            }
        }, []);

        const handleCopy = useCallback(async () => {
            try {
                await navigator.clipboard.writeText(content);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        }, [content]);

        const handleLanguageSelect = useCallback((langId: string) => {
            onLanguageChange?.(langId);
            setShowLanguageMenu(false);
        }, [onLanguageChange]);

        const handleTextareaFocus = useCallback(() => onFocus?.(), [onFocus]);
        const handleTextareaBlur = useCallback(() => onBlur?.(), [onBlur]);

        const handleTextareaChange = useCallback((ev: ChangeEvent<HTMLTextAreaElement>) => {
            const value = ev.target.value;
            setEditContent(value);
            onContentChange?.(value);
        }, [onContentChange]);

        const handlePaste = useCallback((ev: ClipboardEvent<HTMLTextAreaElement>) => {
            ev.stopPropagation();
        }, []);

        const handleKeyDown = useCallback((ev: KeyboardEvent<HTMLTextAreaElement>) => {
            if (ev.key === "Enter" && ev.shiftKey) {
                ev.preventDefault();
                onEnter?.();
                return;
            }

            if (ev.key === "Tab") {
                ev.preventDefault();
                const textarea = ev.currentTarget;
                const { selectionStart, selectionEnd } = textarea;
                const currentValue = editContent;
                const newValue = currentValue.slice(0, selectionStart) + "  " + currentValue.slice(selectionEnd);
                setEditContent(newValue);
                onContentChange?.(newValue);
                requestAnimationFrame(() => {
                    textarea.setSelectionRange(selectionStart + 2, selectionStart + 2);
                });
                return;
            }

            const textarea = ev.currentTarget;
            const { selectionStart, selectionEnd, value } = textarea;
            const isCollapsed = selectionStart === selectionEnd;

            if (!isCollapsed) return;

            if (ev.key === "ArrowUp" && selectionStart === 0) {
                ev.preventDefault();
                onNavigatePrev?.("up");
            } else if (ev.key === "ArrowLeft" && selectionStart === 0) {
                ev.preventDefault();
                onNavigatePrev?.("left");
            } else if (ev.key === "ArrowDown" && selectionStart === value.length) {
                ev.preventDefault();
                onNavigateNext?.("down");
            } else if (ev.key === "ArrowRight" && selectionStart === value.length) {
                ev.preventDefault();
                onNavigateNext?.("right");
            }
        }, [editContent, onEnter, onNavigatePrev, onNavigateNext, onContentChange]);

        useImperativeHandle(ref, () => ({
            focus: () => textareaRef.current?.focus(),
            focusStart: () => {
                textareaRef.current?.focus();
                textareaRef.current?.setSelectionRange(0, 0);
            },
            focusEnd: () => {
                textareaRef.current?.focus();
                const len = textareaRef.current?.value.length || 0;
                textareaRef.current?.setSelectionRange(len, len);
            },
            getText: () => editContent,
            clear: () => {
                setEditContent("");
                onContentChange?.("");
            },
        }), [editContent, onContentChange]);

        const displayLanguage = language && languages.includes(language) ? language : "plaintext";
        const isDark = resolvedTheme === "dark";
        const lineNumWidth = Math.max(2, String(lineCount).length);

        const LINE_HEIGHT = "1.5rem";

        return (
            <div
                data-code-block-id={blockId}
                className={cn(
                    "group/code relative w-full rounded-lg overflow-hidden border transition-shadow duration-200",
                    isDark
                        ? "bg-[#0d1117] border-white/10"
                        : "bg-[#f6f8fa] border-black/10",
                    isSelected && "ring-2 ring-amber/40"
                )}
            >
                <div
                    className={cn(
                        "flex items-center justify-between px-3 py-1.5 border-b",
                        isDark
                            ? "bg-[#161b22] border-white/5"
                            : "bg-[#f0f3f6] border-black/5"
                    )}
                    role="toolbar"
                    aria-label="Code block controls"
                >
                    <div className="relative">
                        <button
                            type="button"
                            tabIndex={0}
                            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                            onKeyDown={(ev) => {
                                if (ev.key === "Enter" || ev.key === " ") {
                                    ev.preventDefault();
                                    setShowLanguageMenu(!showLanguageMenu);
                                }
                            }}
                            className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50",
                                isDark
                                    ? "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                                    : "text-gray-600 hover:text-gray-800 hover:bg-black/5"
                            )}
                            aria-haspopup="listbox"
                            aria-expanded={showLanguageMenu}
                        >
                            {displayLanguage}
                            <IconChevronDown className="size-3" />
                        </button>

                        {showLanguageMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => {
                                        setShowLanguageMenu(false);
                                        setLanguageSearch("");
                                    }}
                                />
                                <div
                                    className={cn(
                                        "absolute top-full left-0 mt-1 z-50 rounded-lg shadow-xl min-w-[200px] max-h-[320px] flex flex-col border overflow-hidden",
                                        isDark
                                            ? "bg-[#1c2128] border-white/10"
                                            : "bg-white border-black/10"
                                    )}
                                    role="listbox"
                                >
                                    <div className={cn(
                                        "p-2 border-b",
                                        isDark ? "border-white/10" : "border-black/10"
                                    )}>
                                        <input
                                            type="text"
                                            value={languageSearch}
                                            onChange={(ev) => setLanguageSearch(ev.target.value)}
                                            placeholder="Search languages..."
                                            className={cn(
                                                "w-full px-2.5 py-1.5 text-xs rounded-md outline-none border transition-colors",
                                                isDark
                                                    ? "bg-white/5 border-white/10 text-gray-200 placeholder-gray-500 focus:border-amber/50"
                                                    : "bg-black/5 border-black/10 text-gray-800 placeholder-gray-400 focus:border-amber/50"
                                            )}
                                            autoFocus
                                            onKeyDown={(ev) => {
                                                if (ev.key === "Escape") {
                                                    setShowLanguageMenu(false);
                                                    setLanguageSearch("");
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="overflow-y-auto flex-1 py-1" role="group">
                                        {languages
                                            .filter((lang) => lang.toLowerCase().includes(languageSearch.toLowerCase()))
                                            .map((lang: string) => (
                                                <button
                                                    key={lang}
                                                    type="button"
                                                    tabIndex={0}
                                                    role="option"
                                                    aria-selected={lang === language}
                                                    onClick={() => {
                                                        handleLanguageSelect(lang);
                                                        setLanguageSearch("");
                                                    }}
                                                    onKeyDown={(ev) => {
                                                        if (ev.key === "Enter" || ev.key === " ") {
                                                            ev.preventDefault();
                                                            handleLanguageSelect(lang);
                                                            setLanguageSearch("");
                                                        }
                                                    }}
                                                    className={cn(
                                                        "w-full px-3 py-1.5 text-left text-xs transition-colors",
                                                        "focus:outline-none focus-visible:bg-amber/10",
                                                        lang === language
                                                            ? "bg-amber/20 text-amber"
                                                            : isDark
                                                                ? "text-gray-300 hover:bg-white/5"
                                                                : "text-gray-700 hover:bg-black/5"
                                                    )}
                                                >
                                                    {lang}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-1" role="group" aria-label="Code block actions">
                        <button
                            type="button"
                            tabIndex={0}
                            onClick={() => setShowLineNumbers(!showLineNumbers)}
                            title={showLineNumbers ? "Hide line numbers" : "Show line numbers"}
                            aria-pressed={showLineNumbers}
                            className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50",
                                showLineNumbers
                                    ? isDark
                                        ? "text-amber bg-amber/10"
                                        : "text-amber-600 bg-amber/10"
                                    : isDark
                                        ? "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
                            )}
                        >
                            <IconHash className="size-3.5" />
                        </button>
                        <button
                            type="button"
                            tabIndex={0}
                            onClick={() => setWordWrap(!wordWrap)}
                            title={wordWrap ? "Disable word wrap" : "Enable word wrap"}
                            aria-pressed={wordWrap}
                            className={cn(
                                "flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50",
                                wordWrap
                                    ? isDark
                                        ? "text-amber bg-amber/10"
                                        : "text-amber-600 bg-amber/10"
                                    : isDark
                                        ? "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-black/5"
                            )}
                        >
                            <IconWrapText className="size-3.5" />
                        </button>
                        <button
                            type="button"
                            tabIndex={0}
                            onClick={handleCopy}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-0.5 rounded text-xs transition-all",
                                "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber/50",
                                copied
                                    ? "text-green-500"
                                    : isDark
                                        ? "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-black/5"
                            )}
                            aria-label={copied ? "Copied to clipboard" : "Copy code"}
                        >
                            {copied ? (
                                <>
                                    <IconCheck className="size-3.5" />
                                    <span>Copied</span>
                                </>
                            ) : (
                                <>
                                    <IconCopy className="size-3.5" />
                                    <span>Copy</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <div className="flex overflow-hidden">
                    {showLineNumbers && !wordWrap && (
                        <div
                            ref={lineNumbersRef}
                            className={cn(
                                "shrink-0 select-none py-3 text-right font-mono text-xs overflow-hidden",
                                isDark
                                    ? "bg-[#161b22]/50 text-gray-600 border-r border-white/5"
                                    : "bg-[#f0f3f6]/50 text-gray-400 border-r border-black/5"
                            )}
                            style={{
                                width: `${lineNumWidth + 2}ch`,
                                paddingLeft: "0.75rem",
                                paddingRight: "0.75rem",
                            }}
                            aria-hidden="true"
                        >
                            {lines.map((_, idx) => (
                                <div
                                    key={idx}
                                    style={{ height: LINE_HEIGHT, lineHeight: LINE_HEIGHT }}
                                >
                                    {idx + 1}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="relative flex-1 min-w-0 overflow-hidden">
                        {/* visual layer */}
                        <div
                            ref={codeContainerRef}
                            className={cn(
                                "shiki-container px-4 py-3 text-sm font-mono min-h-[3.5em] overflow-hidden",
                                "pointer-events-none select-none",
                                wordWrap ? "whitespace-pre-wrap wrap-break-word" : "whitespace-pre"
                            )}
                            style={{ lineHeight: LINE_HEIGHT }}
                            aria-hidden="true"
                            dangerouslySetInnerHTML={{
                                __html: highlightedHtml || `<pre style="margin:0"><code>${escapeHtml(editContent) || " "}</code></pre>`
                            }}
                        />

                        {/* interaction layer */}
                        <textarea
                            ref={textareaRef}
                            value={editContent}
                            onChange={handleTextareaChange}
                            onFocus={handleTextareaFocus}
                            onBlur={handleTextareaBlur}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            onScroll={handleScroll}
                            spellCheck={false}
                            tabIndex={0}
                            className={cn(
                                "absolute inset-0 w-full h-full px-4 py-3 scrollbar-custom",
                                "text-sm font-mono resize-none",
                                "bg-transparent text-transparent outline-none border-none",
                                isDark ? "caret-gray-100" : "caret-gray-800",
                                "selection:bg-amber/30",
                                wordWrap ? "whitespace-pre-wrap wrap-break-word overflow-y-auto overflow-x-hidden" : "whitespace-pre overflow-auto"
                            )}
                            style={{ lineHeight: LINE_HEIGHT }}
                            aria-label="Code editor"
                        />
                    </div>
                </div>
            </div>
        );
    }
));

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
