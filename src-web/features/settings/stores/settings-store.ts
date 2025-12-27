import { listen } from '@tauri-apps/api/event';
import { create } from 'zustand';

interface SettingsState {
  isOpen: boolean;
}

interface SettingsActions {
  open: () => void;
  close: () => void;
  setOpen: (open: boolean) => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  (set) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    setOpen: (open) => set({ isOpen: open }),
  }),
);

if (typeof window !== 'undefined') {
  listen('open-settings', () => {
    useSettingsStore.getState().open();
  }).catch(() => {});
}
