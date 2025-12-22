import { type as osType } from "@tauri-apps/plugin-os";

import { useMemo } from "react";

import { useIsTauri } from "~/hooks/use-tauri";

const TITLEBAR_HEIGHT = 29;
const MAC_LEFT_INSET = 64;
const BASE_LEFT_INSET = 8;
const WIN_LINUX_RIGHT_INSET = 138;
const BASE_RIGHT_INSET = 8;

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

function getLayout(platform: Platform, isTauri: boolean): LayoutTokens {
    const isMac = platform === MACOS;
    const isWindows = platform === WINDOWS;
    const isLinux = platform === LINUX;

    // Browser: keep titlebar visible but without traffic light insets
    if (!isTauri) {
        return {
            platform,
            isMac: false,
            isWindows: false,
            isLinux: false,
            isTauri: false,
            titlebarHeight: TITLEBAR_HEIGHT,
            leftInset: BASE_LEFT_INSET,
            rightInset: BASE_RIGHT_INSET,
        };
    }

    // Tauri: apply platform-specific titlebar adjustments
    return {
        platform,
        isMac,
        isWindows,
        isLinux,
        isTauri: true,
        titlebarHeight: TITLEBAR_HEIGHT,
        leftInset: isMac ? MAC_LEFT_INSET : BASE_LEFT_INSET,
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
        if (userAgent.includes("macos")) {
            return MACOS;
        } else if (userAgent.includes("windows")) {
            return WINDOWS;
        } else if (userAgent.includes("linux")) {
            return LINUX;
        }
    }

    return UNKNOWN;
}

export function usePlatformLayout(): LayoutTokens {
    const isTauri = useIsTauri();
    const platform = useMemo(() => getPlatformSafe(), []);
    return useMemo(() => getLayout(platform, isTauri), [platform, isTauri]);
}
