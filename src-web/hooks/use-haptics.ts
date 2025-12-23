import { useEffect, useState, useCallback } from "react";
import {
    isSupported as checkSupported,
    perform as performHaptic,
    HapticFeedbackPattern,
    PerformanceTime,
} from "~/lib/haptics";

export { HapticFeedbackPattern, PerformanceTime };

export function useHaptics() {
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        checkSupported().then(supported => setSupported(supported)).catch(() => setSupported(false));
    }, []);

    const perform = useCallback(
        (
            pattern: HapticFeedbackPattern = HapticFeedbackPattern.Generic,
            performanceTime: PerformanceTime = PerformanceTime.Now
        ) => {
            if (supported) {
                performHaptic(pattern, performanceTime);
            }
        },
        [supported]
    );

    return { perform, supported };
}
