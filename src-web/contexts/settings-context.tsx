import { createContext, useCallback, useEffect, useState, type PropsWithChildren } from "react";
import { listen } from "@tauri-apps/api/event";

type SettingsContextValue = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    setOpen: (open: boolean) => void;
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: PropsWithChildren) {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const setOpen = useCallback((value: boolean) => setIsOpen(value), []);

    useEffect(() => {
        const cb_1 = listen("open-settings", () => {
            setIsOpen(true);
        });

        return () => {
            cb_1.then((fn) => fn());
        };
    }, []);

    return (
        <SettingsContext.Provider value={{ isOpen, open, close, setOpen }}>
            {children}
        </SettingsContext.Provider>
    );
}
