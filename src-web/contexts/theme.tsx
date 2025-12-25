import { createContext, useEffect, useState, type PropsWithChildren } from "react"
import { invoke } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"

import { useIsTauri } from "~/hooks/use-tauri"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = PropsWithChildren & {
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    resolvedTheme: "dark" | "light"
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    resolvedTheme: "dark",
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
    const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark")
    const isTauri = useIsTauri()

    useEffect(() => {
        const root = window.document.documentElement
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        let unlisten: (() => void) | undefined

        const applyTheme = (override?: "light" | "dark") => {
            root.classList.remove("light", "dark")

            const effectiveTheme = override || (theme === "system"
                ? (mediaQuery.matches ? "dark" : "light")
                : theme)

            root.classList.add(effectiveTheme)
            setResolvedTheme(effectiveTheme)

            if (isTauri) {
                const bgColor = effectiveTheme === "dark" ? "#1a1a1a" : "#ffffff"
                invoke('plugin:notara-mac-window|set_theme', { bgColor }).catch(() => { })
            }
        }

        applyTheme()

        if (theme === "system") {
            const handleMediaChange = () => applyTheme()
            mediaQuery.addEventListener("change", handleMediaChange)

            if (isTauri) {
                getCurrentWindow().onThemeChanged(({ payload: systemTheme }) => {
                    applyTheme(systemTheme)
                }).then(fn => unlisten = fn)
            }

            return () => {
                mediaQuery.removeEventListener("change", handleMediaChange)
                unlisten?.()
            }
        }
    }, [theme, isTauri])

    const value = {
        theme,
        resolvedTheme,
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
