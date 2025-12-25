export const THEME = {
    paragraph: "my-0 leading-relaxed",
    text: {
        bold: "font-semibold",
        italic: "italic",
        strikethrough: "line-through text-muted-foreground",
        code: "bg-muted px-1.5 py-0.5 rounded text-[0.875em] font-[ui-monospace,'SF_Mono','Cascadia_Code',monospace]",
        underline: "underline",
    },
    heading: {
        h1: "text-3xl font-bold leading-tight my-0 py-1",
        h2: "text-2xl font-semibold leading-tight my-0 py-1",
        h3: "text-xl font-semibold leading-snug my-0 py-1",
    },
    quote: "border-l-2 border-amber/50 pl-4 italic text-muted-foreground my-0",
    list: {
        ul: "list-disc pl-6 my-0",
        ol: "list-decimal pl-6 my-0",
        listitem: "my-0",
        nested: {
            listitem: "list-none",
        },
    },
    code: "bg-muted rounded p-3 font-mono text-sm",
    link: "text-amber underline underline-offset-2",
} as const;