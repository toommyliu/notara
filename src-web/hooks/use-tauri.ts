import { useMemo } from "react";

export function useIsTauri(): boolean {
    return useMemo(() => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window, []);
}
