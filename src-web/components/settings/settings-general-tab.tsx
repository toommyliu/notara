import IconSun from "~icons/lucide/sun";
import IconMoon from "~icons/lucide/moon";
import IconMonitor from "~icons/lucide/monitor";

import { useTheme } from "~/hooks/use-theme";

import { cn } from "~/lib/utils";

type ThemeOptionProps = {
    theme: "light" | "dark" | "system";
    isActive: boolean;
    onClick: () => void;
};

function ThemeOption({ theme, isActive, onClick }: ThemeOptionProps) {
    const Icon = theme === "light" ? IconSun : theme === "dark" ? IconMoon : IconMonitor;
    const label = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex flex-col items-center gap-2.5 p-3 rounded-xl transition-all duration-200",
                "border-2",
                isActive
                    ? "border-foreground bg-accent shadow-sm"
                    : "border-transparent bg-muted/40 hover:bg-muted/70"
            )}
        >
            <div className="flex items-center gap-1.5">
                <Icon className="size-3.5 text-muted-foreground" />
                <span
                    className={cn(
                        "text-xs font-medium transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                >
                    {label}
                </span>
            </div>

            {isActive && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 bg-foreground rounded-full" />
            )}
        </button>
    );
}

export function GeneralTab() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                <div>
                    <h3 className="text-sm font-medium">Theme</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Choose your preferred appearance
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <ThemeOption
                        theme="light"
                        isActive={theme === "light"}
                        onClick={() => setTheme("light")}
                    />
                    <ThemeOption
                        theme="dark"
                        isActive={theme === "dark"}
                        onClick={() => setTheme("dark")}
                    />
                    <ThemeOption
                        theme="system"
                        isActive={theme === "system"}
                        onClick={() => setTheme("system")}
                    />
                </div>
            </div>
        </div>
    );
}
