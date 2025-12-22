import { createContext, useEffect, useState, type PropsWithChildren } from "react"
import { invoke } from "@tauri-apps/api/core"

import { useIsTauri } from "~/hooks/use-tauri"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = PropsWithChildren & {
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    const isTauri = useIsTauri()

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    useEffect(() => {
        if (!isTauri) return

        const applyNativeTheme = async () => {
            try {
                const bgColor = theme === "dark" ? "#1a1a1a" : "#ffffff"
                await invoke('plugin:notara-mac-window|set_theme', { bgColor })
            } catch {
            }
        }

        applyNativeTheme()
    }, [theme, isTauri])

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

