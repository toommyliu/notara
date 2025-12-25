import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";

import { scan } from "react-scan";

import { ThemeProvider } from "~/providers/theme";
import { DragProvider } from "~/providers/drag-context";

import { routeTree } from "~/routeTree.gen";

const router = createRouter({ routeTree });

scan({
  enabled: import.meta.env.DEV,
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ThemeProvider>
      <DragProvider>
        <RouterProvider router={router} />
      </DragProvider>
    </ThemeProvider>
  </StrictMode>,
);

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

