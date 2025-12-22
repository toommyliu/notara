import { useContext } from "react";

import { TabsContext } from "~/contexts/tabs-context";

export function useTabs() {
    const context = useContext(TabsContext);

    if (!context)
        throw new Error("useTabs must be used within a TabsProvider");

    return context;
}
