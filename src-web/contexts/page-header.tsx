import { createContext, type PropsWithChildren, useState, type ReactNode } from "react";

export type PageHeaderConfig = {
    title?: string;
    emoji?: string;
    isPrivate?: boolean;
    actions?: ReactNode;
}

type PageHeaderContextValue = {
    config: PageHeaderConfig;
    setConfig: (config: PageHeaderConfig) => void;
}

export const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: PropsWithChildren) {
    const [config, setConfig] = useState<PageHeaderConfig>({});

    return (
        <PageHeaderContext.Provider value={{ config, setConfig }}>
            {children}
        </PageHeaderContext.Provider>
    );
}

