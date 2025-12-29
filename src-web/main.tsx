import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { DragProvider } from '~/providers/drag-context';
import { ThemeProvider } from '~/providers/theme';

import { routeTree } from '~/routeTree.gen';

import { TooltipProvider } from '~/ui/tooltip';

const router = createRouter({ routeTree });

if (import.meta.env.VITE_REACT_SCAN === 'true') {
  void import('react-scan')
    .then(({ scan }) => {
      scan({ enabled: true });
    })
    .catch(() => {});
}

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
);

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
