import type { Block } from "~/features/notes/store";

export const BLOCK_MIME_TYPE = "application/x-notara-blocks";

export const BlockType = {
    TEXT: "text",
    H1: "h1",
    H2: "h2",
    H3: "h3",
    BULLET: "bullet",
    NUMBERED: "numbered",
    TODO: "todo",
    QUOTE: "quote",
    CODE: "code",
    DIVIDER: "divider",
} as const;
export type BlockTypeValue = typeof BlockType[keyof typeof BlockType];

const BLOCK_STYLES: Record<BlockTypeValue, string> = {
    [BlockType.TEXT]: "",
    [BlockType.H1]: "text-3xl font-sans font-bold",
    [BlockType.H2]: "text-2xl font-sans font-semibold",
    [BlockType.H3]: "text-xl font-sans font-medium",
    [BlockType.BULLET]: "pl-6 before:content-['•'] before:absolute before:left-0 before:text-muted-foreground relative",
    [BlockType.NUMBERED]: "pl-6",
    [BlockType.TODO]: "pl-6",
    [BlockType.QUOTE]: "pl-4 border-l-2 border-amber/50 italic text-muted-foreground",
    [BlockType.CODE]: "font-mono text-sm bg-muted px-3 py-2 rounded-md",
    [BlockType.DIVIDER]: "",
};

const BLOCK_PLACEHOLDER_CONTENT = "Type '/' for commands...";

const BLOCK_PLACEHOLDERS: Record<BlockTypeValue, string> = {
    [BlockType.TEXT]: BLOCK_PLACEHOLDER_CONTENT,
    [BlockType.H1]: "Heading 1",
    [BlockType.H2]: "Heading 2",
    [BlockType.H3]: "Heading 3",
    [BlockType.BULLET]: "List item",
    [BlockType.NUMBERED]: "List item",
    [BlockType.TODO]: "To-do",
    [BlockType.QUOTE]: "Quote",
    [BlockType.CODE]: "Code",
    [BlockType.DIVIDER]: "",
};

export function createBlock(type: BlockTypeValue = BlockType.TEXT, content: string = "", indent: number = 0, language?: string): Block {
    return {
        id: crypto.randomUUID(),
        type,
        content,
        indent,
        ...(language && { language }),
    };
}

export function getBlockStyles(type: BlockTypeValue): string {
    return BLOCK_STYLES[type] ?? "";
}

export function getPlaceholder(type: BlockTypeValue): string {
    return BLOCK_PLACEHOLDERS[type] ?? BLOCK_PLACEHOLDER_CONTENT;
}

export function formatBlocksAsPlainText(blocksToFormat: Block[]): string {
    return blocksToFormat.map((block, index) => {
        const content = block.content || "";
        switch (block.type) {
            case BlockType.H1:
            case BlockType.H2:
            case BlockType.H3:
                return content;
            case BlockType.BULLET:
                return `• ${content}`;
            case BlockType.NUMBERED:
                return `${index + 1}. ${content}`;
            case BlockType.QUOTE:
                return `"${content}"`;
            case BlockType.TODO:
                return `☐ ${content}`;
            case BlockType.DIVIDER:
                return "───";
            default:
                return content;
        }
    }).join("\n");
}

export function parseMarkdownToBlocks(text: string): Block[] {
    const lines = text.split("\n");
    const result: Block[] = [];

    for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];

        // Skip completely empty lines at start/end
        if (line === "" && (idx === 0 || idx === lines.length - 1))
            continue;

        // Headings
        if (line.startsWith("### ")) {
            result.push(createBlock(BlockType.H3, line.slice(4)));
        } else if (line.startsWith("## ")) {
            result.push(createBlock(BlockType.H2, line.slice(3)));
        } else if (line.startsWith("# ")) {
            result.push(createBlock(BlockType.H1, line.slice(2)));
        }

        // Bullet lists (-, *, •)
        else if (/^[-*•]\s/.test(line)) {
            result.push(createBlock(BlockType.BULLET, line.slice(2)));
        }

        // Numbered lists (1., 2., etc)
        else if (/^\d+\.\s/.test(line)) {
            const content = line.replace(/^\d+\.\s/, "");
            result.push(createBlock(BlockType.NUMBERED, content));
        }

        // Todo items ([ ], [x], [X])
        else if (/^\[[ xX]?\]\s/.test(line)) {
            const content = line.replace(/^\[[ xX]?\]\s/, "");
            result.push(createBlock(BlockType.TODO, content));
        }

        // Blockquotes
        else if (line.startsWith("> ")) {
            result.push(createBlock(BlockType.QUOTE, line.slice(2)));
        }

        // Dividers
        else if (/^-{3,}$/.test(line) || /^\*{3,}$/.test(line) || /^_{3,}$/.test(line)) {
            result.push(createBlock(BlockType.DIVIDER, ""));
        }

        // Code blocks (```), treat content as single code block
        else if (line.startsWith("```")) {
            // Extract language from opening fence (e.g., ```typescript)
            const langMatch = line.match(/^```(\w+)?/);
            const language = langMatch?.[1] || undefined;
            const codeLines: string[] = [];
            idx++; // Skip opening ```
            while (idx < lines.length && !lines[idx].startsWith("```")) {
                codeLines.push(lines[idx]);
                idx++;
            }

            result.push(createBlock(BlockType.CODE, codeLines.join("\n"), 0, language));
        }

        // Plain text (including empty lines that become empty text blocks)
        else {
            result.push(createBlock(BlockType.TEXT, line));
        }
    }

    return result;
}
