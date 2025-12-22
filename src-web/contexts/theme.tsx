import { createContext, useEffect, useState, type PropsWithChildren } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"

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
    theme: "light",
    setTheme: () => null,
}

export const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "light",
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
                const target: "light" | "dark" | null = theme === "dark" ? "dark" : theme === "light" ? "light" : null
                await getCurrentWindow().setTheme(target)
            } catch {
            }
        }

        applyNativeTheme()
    }, [theme])

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

