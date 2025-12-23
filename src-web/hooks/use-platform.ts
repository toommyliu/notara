import { type as osType } from "@tauri-apps/plugin-os";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { useMemo, useState, useEffect } from "react";

import { useIsTauri } from "~/hooks/use-tauri";

const TITLEBAR_HEIGHT = 40;
const MAC_LEFT_INSET = 72;
const BASE_LEFT_INSET = 12;
const WIN_LINUX_RIGHT_INSET = 138;
const BASE_RIGHT_INSET = 12;
const RIBBON_WIDTH = 48;

const MACOS = "macos";
const WINDOWS = "windows";
const LINUX = "linux";
const UNKNOWN = "unknown";

type Platform = typeof MACOS | typeof WINDOWS | typeof LINUX | typeof UNKNOWN;

type LayoutTokens = {
    platform: Platform;
    isMac: boolean;
    isWindows: boolean;
    isLinux: boolean;
    isTauri: boolean;
    titlebarHeight: number;
    leftInset: number;
    rightInset: number;
    ribbonWidth: number;
    isFullscreen: boolean;
};

function normalizePlatform(osTypeValue: string): Platform {
    switch (osTypeValue.toLowerCase()) {
        case MACOS:
            return MACOS;
        case WINDOWS:
            return WINDOWS;
        case LINUX:
            return LINUX;
        default:
            return UNKNOWN;
    }
}

function getLayout(platform: Platform, isTauri: boolean, isFullscreen: boolean): LayoutTokens {
    const isMac = platform === MACOS;
    const isWindows = platform === WINDOWS;
    const isLinux = platform === LINUX;

    const baseTokens = {
        platform,
        isMac,
        isWindows,
        isLinux,
        isTauri,
        ribbonWidth: RIBBON_WIDTH,
        isFullscreen,
        titlebarHeight: TITLEBAR_HEIGHT,
        rightInset: BASE_RIGHT_INSET,
    };

    if (!isTauri) {
        return {
            ...baseTokens,
            leftInset: BASE_LEFT_INSET,
            rightInset: BASE_RIGHT_INSET,
        };
    }

    // Tauri-specific overrides
    return {
        ...baseTokens,
        leftInset: isMac && !isFullscreen ? MAC_LEFT_INSET : BASE_LEFT_INSET,
        rightInset: isMac ? BASE_RIGHT_INSET : WIN_LINUX_RIGHT_INSET,
    };
}

function getPlatformSafe(): Platform {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
        try {
            return normalizePlatform(osType());
        } catch {
        }
    }

    // fallback to userAgent if tauri fails
    if (typeof navigator !== "undefined") {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes("macintosh") || userAgent.includes("mac os x")) {
            return MACOS;
        } else if (userAgent.includes("windows")) {
            return WINDOWS;
        } else if (userAgent.includes("linux")) {
            return LINUX;
        }
    }

    return UNKNOWN;
}

export function useIsMacOS(): boolean {
    return useMemo(() => getPlatformSafe() === MACOS, []);
}

export function usePlatformLayout(): LayoutTokens {
    const isTauri = useIsTauri();
    const platform = useMemo(() => getPlatformSafe(), []);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (!isTauri) return;

        const checkFullscreen = async () => {
            const win = getCurrentWindow();
            const full = await win.isFullscreen();
            setIsFullscreen(full);
        };

        checkFullscreen();

        let unlisten: (() => void) | undefined;

        const setup = async () => {
            const win = getCurrentWindow();
            // Listen for resize which happens on fullscreen toggle
            unlisten = await win.onResized(() => {
                checkFullscreen();
            });
        };

        setup();

        return () => {
            if (unlisten) unlisten();
        };
    }, [isTauri]);

    return useMemo(() => getLayout(platform, isTauri, isFullscreen), [platform, isTauri, isFullscreen]);
}
