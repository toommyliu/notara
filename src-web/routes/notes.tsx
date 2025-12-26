import { createFileRoute } from "@tanstack/react-router";

import { NoteEditor } from "~/features/editor";

export const Route = createFileRoute("/notes")({
    component: NotesPage,
});

function NotesPage() {
    return <NoteEditor />;
}