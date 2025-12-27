import type { ShortcutBinding, ShortcutId } from '@notara/shortcuts';
import {
  DEFAULT_BINDINGS,
  MENU_SHORTCUTS,

} from '@notara/shortcuts';
import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';

import { persist } from 'zustand/middleware';

interface ShortcutsState {
  bindings: Record<ShortcutId, ShortcutBinding>;
}

interface ShortcutsActions {
  setBinding: (id: ShortcutId, binding: ShortcutBinding) => void;
  resetToDefaults: () => void;
}

export function bindingToAccelerator(binding: ShortcutBinding): string {
  const parts: string[] = [];

  for (const mod of binding.modifiers) {
    switch (mod) {
      case 'meta':
        parts.push('Cmd');
        break;
      case 'ctrl':
        parts.push('Ctrl');
        break;
      case 'shift':
        parts.push('Shift');
        break;
      case 'alt':
        parts.push('Alt');
        break;
    }
  }

  let key = binding.key;
  if (key === ' ')
    key = 'Space';

  parts.push(key.length === 1 ? key.toUpperCase() : key);

  return parts.join('+');
}

export function formatBindingForDisplay(binding: ShortcutBinding): string {
  const symbols: string[] = [];

  if (binding.modifiers.includes('ctrl'))
    symbols.push('⌃');
  if (binding.modifiers.includes('alt'))
    symbols.push('⌥');
  if (binding.modifiers.includes('shift'))
    symbols.push('⇧');
  if (binding.modifiers.includes('meta'))
    symbols.push('⌘');

  let key = binding.key;
  if (key === 'Tab')
    key = '⇥';
  else if (key === ' ')
    key = 'Space';
  else if (key === 'ArrowUp')
    key = '↑';
  else if (key === 'ArrowDown')
    key = '↓';
  else if (key === 'ArrowLeft')
    key = '←';
  else if (key === 'ArrowRight')
    key = '→';
  else if (key === 'Enter')
    key = '↩';
  else if (key === 'Backspace')
    key = '⌫';
  else if (key === 'Escape')
    key = '⎋';
  else if (key === '\\')
    key = '\\';
  else if (key === 'Dead')
    key = '?';
  else key = key.toUpperCase();

  symbols.push(key);
  return symbols.join(' ');
}

async function syncMenuAccelerators(bindings: Record<ShortcutId, ShortcutBinding>) {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
    return;
  }

  try {
    const accelerators: Record<string, string> = {};

    for (const id of MENU_SHORTCUTS) {
      const binding = bindings[id];
      if (binding) {
        accelerators[id] = bindingToAccelerator(binding);
      }
    }

    await invoke('update_menu_accelerators', { accelerators });
  }
  catch (err) {
    console.error('[shortcuts] Failed to sync menu accelerators:', err);
  }
}

export const useShortcutsStore = create<ShortcutsState & ShortcutsActions>()(
  persist(
    set => ({
      bindings: { ...DEFAULT_BINDINGS },

      setBinding: (id, binding) => {
        const newBindings = { ...useShortcutsStore.getState().bindings, [id]: binding };
        set({ bindings: newBindings });
        syncMenuAccelerators(newBindings);
      },

      resetToDefaults: () => {
        set({ bindings: { ...DEFAULT_BINDINGS } });
        syncMenuAccelerators(DEFAULT_BINDINGS);
      },
    }),
    {
      name: 'notara:shortcuts',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ShortcutsState> | undefined;
        return {
          ...currentState,
          bindings: {
            ...DEFAULT_BINDINGS,
            ...(persisted?.bindings ?? {}),
          },
        };
      },
    },
  ),
);

if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncMenuAccelerators(useShortcutsStore.getState().bindings);
  }, 500);
}
