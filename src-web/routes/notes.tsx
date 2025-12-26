import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/notes")({
    component: NotesPage,
});

function NotesPage() {
    return (
        <div>
            <h1>Notes</h1>
        </div>
    );
}