import { createRouter, RouterProvider } from "@tanstack/react-router";

import { ThemeProvider } from "~/contexts/theme";
import { routeTree } from "~/routeTree.gen";

export const router = createRouter({ routeTree });

export function Providers() {
    return (
        <ThemeProvider defaultTheme="light">
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}