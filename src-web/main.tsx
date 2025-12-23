import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";

import { ThemeProvider } from "~/contexts/theme";
import { DragProvider } from "~/contexts/drag-context";
import { routeTree } from "~/routeTree.gen";

const router = createRouter({ routeTree });

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
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

