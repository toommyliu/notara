import { useContext, useEffect } from "react";
import { PageHeaderContext, type PageHeaderConfig } from "~/contexts/page-header";

export function usePageHeaderContext() {
    const context = useContext(PageHeaderContext);

    if (!context)
        throw new Error("usePageHeaderContext must be used within PageHeaderProvider");

    return context;
}

export function usePageHeader(config: PageHeaderConfig) {
    const { setConfig } = usePageHeaderContext();

    useEffect(() => {
        setConfig(config);
        return () => setConfig({});
    }, [config.title, config.emoji, config.isPrivate, config.actions, setConfig]);
}
