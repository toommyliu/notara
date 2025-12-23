import { useMemo } from "react";
import { isTauri } from "@tauri-apps/api/core";

export function useIsTauri(): boolean {
    return useMemo(() => isTauri() || typeof window !== "undefined" && "__TAURI_INTERNALS__" in window, []);
}
