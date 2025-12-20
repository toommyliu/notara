import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/notes")({
    component: NotesPage,
});

function NotesPage() {
    return (
        <div>
            <h1>Note Page</h1>
            <Link to="/">Back to Root</Link>
        </div>
    );
}