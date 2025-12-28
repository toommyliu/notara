import { createRootRoute, Outlet } from '@tanstack/react-router';
import { listen } from '@tauri-apps/api/event';
import { lazy, Suspense, useEffect, useMemo } from 'react';

import {
  AppHeader,
  AppSidebar,
  TitlebarSpacer,
} from '~/features/layout';
import { useSplitViewStore } from '~/features/layout/stores/split-view-store';
import { useTabsStore } from '~/features/layout/stores/tabs-store';

import { useNotesStore } from '~/features/notes/store';
import { SettingsDialogContent } from '~/features/settings';
import { useSettingsStore } from '~/features/settings/stores/settings-store';
import { useHotKeys } from '~/hooks/use-hotkey';

import { useIsTauri } from '~/hooks/use-tauri';
import { SidebarInset, SidebarProvider, useSidebar } from '~/ui/sidebar';

const TanStackRouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((mod) => ({
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
  const { toggleTabBar, cycleTab } = useTabsStore();
  const addNote = useNotesStore((s) => s.addNote);
  const { cyclePane } = useSplitViewStore();
  const { open: openSettings } = useSettingsStore();
  const isTauri = useIsTauri();

  // Tauri event listeners for menu actions
  useEffect(() => {
    if (typeof window === 'undefined' || !isTauri) return;

    const unlisteners: (() => void)[] = [];

    listen('toggle-sidebar', () => toggleSidebar())
      .then((fn) => unlisteners.push(fn))
      .catch(() => {});

    listen('open-settings', () => openSettings())
      .then((fn) => unlisteners.push(fn))
      .catch(() => {});

    listen('new-note', () => addNote())
      .then((fn) => unlisteners.push(fn))
      .catch(() => {});

    return () => {
      unlisteners.forEach((fn) => fn());
    };
  }, [isTauri, toggleSidebar, openSettings, addNote]);

  const hotkeyHandlers = useMemo(
    () =>
      ({
        'toggle-sidebar': () => toggleSidebar(),
        'toggle-tab-bar': () => toggleTabBar(),
        'cycle-tab-forward': () => cycleTab(1),
        'cycle-tab-backward': () => cycleTab(-1),
        'cycle-pane-forward': () => cyclePane(1),
        'cycle-pane-backward': () => cyclePane(-1),
        'new-note': () => addNote(),
        'open-settings': () => openSettings(),
      }) as const,
    [toggleSidebar, toggleTabBar, cycleTab, cyclePane, addNote, openSettings],
  );

  useHotKeys(hotkeyHandlers);

  return (
    <>
      <AppHeader />
      <AppSidebar />
      <MainContent />
      <SettingsDialogContent />
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <TanStackRouterDevtools position="bottom-right" />
        </Suspense>
      )}
    </>
  );
}

export const Route = createRootRoute({
  component: () => (
    <SidebarProvider>
      <AppShell />
    </SidebarProvider>
  ),
});
