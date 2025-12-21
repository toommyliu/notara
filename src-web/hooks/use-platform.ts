import { type as osType } from "@tauri-apps/plugin-os";

import { useMemo } from "react";

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

function getLayout(platform: Platform): LayoutTokens {
    const isMac = platform === MACOS;
    const isWindows = platform === WINDOWS;
    const isLinux = platform === LINUX;

    return {
        platform,
        isMac,
        isWindows,
        isLinux,
        titlebarHeight: TITLEBAR_HEIGHT,
        leftInset: isMac ? MAC_LEFT_INSET : BASE_LEFT_INSET,
        rightInset: isMac ? BASE_RIGHT_INSET : WIN_LINUX_RIGHT_INSET,
    };
}

export function usePlatformLayout(): LayoutTokens {
    const platform = useMemo(() => normalizePlatform(osType()), []);
    return useMemo(() => getLayout(platform), [platform]);
}
