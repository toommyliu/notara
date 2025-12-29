import { createRootRoute, Outlet } from '@tanstack/react-router';
import { listen } from '@tauri-apps/api/event';
import { lazy, Suspense, useEffect, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import {
  AppHeader,
  AppSidebar,
  TitlebarSpacer,
} from '~/features/layout';
import { useTabsStore } from '~/features/layout/stores/tabs-store';
import { useNotesStore } from '~/features/notes/store';
import { SettingsDialogContent } from '~/features/settings';
import { useSettingsStore } from '~/features/settings/stores/settings-store';

import { useHotKeys } from '~/hooks/use-hotkey';
import { useIsTauri } from '~/hooks/use-tauri';

import { SidebarInset, SidebarProvider, useSidebar } from '~/ui/sidebar';

const DEV = import.meta.env.DEV;
const TanStackRouterDevtools = DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then(mod => ({
        default: mod.TanStackRouterDevtools,
      })),
    )
  : () => null;

function MainContent() {
  return (
    <SidebarInset>
      <TitlebarSpacer />
      <div className="flex flex-1 min-h-0">
        <Outlet />
      </div>
    </SidebarInset>
  );
}

function AppShell() {
  const { toggleSidebar } = useSidebar();
  const toggleTabBar = useTabsStore(s => s.toggleTabBar);
  const cyclePane = useTabsStore(s => s.cyclePane);
  const cycleSide = useTabsStore(s => s.cycleSide);
  const addNote = useNotesStore(s => s.addNote);
  const { open: openSettings } = useSettingsStore();
  const isTauri = useIsTauri();

  // Tauri event listeners for menu actions
  useEffect(() => {
    if (typeof window === 'undefined' || !isTauri) {
      return;
    }

    const unlisteners: (() => void)[] = [];

    listen('toggle-sidebar', () => toggleSidebar())
      .then(fn => unlisteners.push(fn))
      .catch(() => {});

    listen('open-settings', () => openSettings())
      .then(fn => unlisteners.push(fn))
      .catch(() => {});

    listen('new-note', () => addNote())
      .then(fn => unlisteners.push(fn))
      .catch(() => {});

    return () => {
      unlisteners.forEach(fn => fn());
    };
  }, [isTauri, toggleSidebar, openSettings, addNote]);

  const hotkeyHandlers = useMemo(
    () =>
      ({
        'toggle-sidebar': () => toggleSidebar(),
        'toggle-tab-bar': () => toggleTabBar(),
        'cycle-tab-forward': () => cyclePane(1),
        'cycle-tab-backward': () => cyclePane(-1),
        'cycle-pane-forward': () => cycleSide(1),
        'cycle-pane-backward': () => cycleSide(-1),
        'new-note': () => addNote(),
        'open-settings': () => openSettings(),
      }) as const,
    [toggleSidebar, toggleTabBar, cyclePane, cycleSide, addNote, openSettings],
  );

  useHotKeys(hotkeyHandlers);

  return (
    <>
      <AppHeader />
      <AppSidebar />
      <MainContent />
      <SettingsDialogContent />
      {DEV && (
        <Suspense fallback={null}>
          <TanStackRouterDevtools position="bottom-right" />
        </Suspense>
      )}
    </>
  );
}

export const Route = createRootRoute({
  component: () => (
    <DndProvider backend={HTML5Backend}>
      <SidebarProvider>
        <AppShell />
      </SidebarProvider>
    </DndProvider>
  ),
});
