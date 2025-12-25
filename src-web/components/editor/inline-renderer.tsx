import { memo } from "react";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "~/lib/utils";

type InlineRendererProps = {
    content: string;
    className?: string;
};

// Custom components for styling inline markdown elements
const MARKDOWN_COMPONENTS: Components = {
    // Inline formatting
    strong: ({ children }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="italic">{children}</em>
    ),
    code: ({ children }) => (
        <code className="inline-code">{children}</code>
    ),
    // strikethrough
    del: ({ children }) => (
        <del className="line-through text-muted-foreground">{children}</del>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            className="inline-link"
            target="_blank"
            rel="noopener noreferrer"
        >
            {children}
        </a>
    ),

    // Strip block-level wrappers for true inline rendering
    p: ({ children }) => <>{children}</>,

    // Prevent these block elements from rendering in inline context
    h1: ({ children }) => <>{children}</>,
    h2: ({ children }) => <>{children}</>,
    h3: ({ children }) => <>{children}</>,
    h4: ({ children }) => <>{children}</>,
    h5: ({ children }) => <>{children}</>,
    h6: ({ children }) => <>{children}</>,
    ul: ({ children }) => <>{children}</>,
    ol: ({ children }) => <>{children}</>,
    li: ({ children }) => <>{children}</>,
    blockquote: ({ children }) => <>{children}</>,
    pre: ({ children }) => <>{children}</>,
};

/**
 * Renders inline markdown content using react-markdown.
 * XSS-safe by design - converts markdown to React components without dangerouslySetInnerHTML.
 * 
 * Supported formats:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - `inline code`
 * - ~~strikethrough~~
 * - [link text](url)
 * - Autolinks via remark-gfm
 */
export const InlineRenderer = memo(function InlineRenderer({
    content,
    className,
}: InlineRendererProps) {
    if (!content) {
        return null;
    }

    return (
        <span className={cn("inline-markdown", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={MARKDOWN_COMPONENTS}
            >
                {content}
            </ReactMarkdown>
        </span>
    );
});
