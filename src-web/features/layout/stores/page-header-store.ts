import { create } from "zustand";
import type { ReactNode } from "react";

export type PageHeaderConfig = {
    title?: string;
    emoji?: string;
    isPrivate?: boolean;
    actions?: ReactNode;
};

type PageHeaderState = {
    config: PageHeaderConfig;
};

type PageHeaderActions = {
    setConfig: (config: PageHeaderConfig) => void;
};

export const usePageHeaderStore = create<PageHeaderState & PageHeaderActions>()((set) => ({
    config: {},
    setConfig: (config) => set({ config }),
}));
