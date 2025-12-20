import { createRouter, RouterProvider } from "@tanstack/react-router";

import { ThemeProvider } from "./theme-provider";
import { routeTree } from "~/routeTree.gen";

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}


export function Providers() {
    return (
        <ThemeProvider defaultTheme="system">
            <RouterProvider router={router} />
        </ThemeProvider>
    );
}