import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RootPage,
});

function RootPage() {
  return (
    <div>
      <h1>Root</h1>
      <Link to="/notes">Go to Notes</Link>
    </div>
  );
}
