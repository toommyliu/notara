import { isTauri } from '@tauri-apps/api/core';
import { useMemo } from 'react';

export function useIsTauri(): boolean {
  return useMemo(
    () =>
      isTauri() ||
      (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window),
    [],
  );
}
