import type { ReactNode } from 'react';
import { create } from 'zustand';

export interface PageHeaderConfig {
  title?: string;
  emoji?: string;
  isPrivate?: boolean;
  actions?: ReactNode;
}

interface PageHeaderState {
  config: PageHeaderConfig;
}

interface PageHeaderActions {
  setConfig: (config: PageHeaderConfig) => void;
}

export const usePageHeaderStore = create<PageHeaderState & PageHeaderActions>()(set => ({
  config: {},
  setConfig: config => set({ config }),
}));
