import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ThemeProvider } from '~/providers/theme';

import { routeTree } from '~/routeTree.gen';

const router = createRouter({ routeTree });

if (import.meta.env.VITE_REACT_SCAN === 'true') {
  void import('react-scan')
    .then(({ scan }) => {
      scan({ enabled: true });
    })
    .catch(() => { });
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
