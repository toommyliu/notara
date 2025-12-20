import { ThemeProvider } from "./theme-provider"
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
    return <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
}