import type { Modifier, ShortcutBinding, ShortcutId } from '@notara/shortcuts';
import { useEffect, useRef } from 'react';

import { useShortcutsStore } from '~/features/settings/stores/shortcuts-store';
import { getKeyFromEvent } from '~/lib/keyboard';

function eventMatchesBinding(
  ev: KeyboardEvent,
  binding: ShortcutBinding,
): boolean {
  const wantsMeta = binding.modifiers.includes('meta' as Modifier);
  const wantsCtrl = binding.modifiers.includes('ctrl' as Modifier);
  const wantsShift = binding.modifiers.includes('shift' as Modifier);
  const wantsAlt = binding.modifiers.includes('alt' as Modifier);

  const modifiersMatch
    = (wantsMeta ? ev.metaKey : !ev.metaKey)
      && (wantsCtrl ? ev.ctrlKey : !ev.ctrlKey)
      && (wantsShift ? ev.shiftKey : !ev.shiftKey)
      && (wantsAlt ? ev.altKey : !ev.altKey);

  if (!modifiersMatch)
    return false;

  const eventKey = getKeyFromEvent(ev);
  return eventKey.toLowerCase() === binding.key.toLowerCase();
}

function isInputElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement))
    return false;

  return (
    target.tagName === 'INPUT'
    || target.tagName === 'TEXTAREA'
    || target.isContentEditable
  );
}

interface HotKeyOptions {
  enabled?: boolean;
  allowDefault?: boolean;
  allowInInput?: boolean;
  debounceMs?: number;
}

export function useHotKeys(
  handlers: Partial<Record<ShortcutId, () => void>>,
  options: HotKeyOptions = {},
) {
  const { bindings } = useShortcutsStore();
  const {
    enabled = true,
    allowDefault = false,
    allowInInput = false,
    debounceMs = 150,
  } = options;

  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const lastFiredRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled)
      return;

    const handleKeyDown = (ev: KeyboardEvent) => {
      if (!allowInInput && isInputElement(ev.target)) {
        const settingsBinding = bindings['open-settings'];
        if (settingsBinding && eventMatchesBinding(ev, settingsBinding)) {
          ev.preventDefault();
          handlersRef.current['open-settings']?.();
        }
        return;
      }

      if (document.activeElement?.closest('[data-disable-hotkey]'))
        return;

      for (const [action, callback] of Object.entries(handlersRef.current)) {
        if (!callback)
          continue;

        const binding = bindings[action as ShortcutId];
        if (!binding)
          continue;

        if (eventMatchesBinding(ev, binding)) {
          if (!allowDefault) {
            ev.preventDefault();
            ev.stopPropagation();
          }

          const now = Date.now();
          if (now - lastFiredRef.current < debounceMs)
            return;

          lastFiredRef.current = now;

          callback();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [bindings, enabled, allowDefault, allowInInput, debounceMs]);
}

export { eventMatchesBinding };
