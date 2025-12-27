import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// import { scan } from "react-scan";

import { DragProvider } from '~/providers/drag-context'
import { ThemeProvider } from '~/providers/theme'

import { routeTree } from '~/routeTree.gen'
import { TooltipProvider } from '~/ui/tooltip'

const router = createRouter({ routeTree })

// scan({
//   enabled: import.meta.env.REACT_SCAN === "true",
// });

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ThemeProvider>
      <DragProvider>
        <TooltipProvider delay={500}>
          <RouterProvider router={router} />
        </TooltipProvider>
      </DragProvider>
    </ThemeProvider>
  </StrictMode>,
)

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
