import { useCallback, useEffect, useState } from 'react';
import {
  isSupported as checkSupported,
  HapticFeedbackPattern,
  PerformanceTime,
  perform as performHaptic,
} from '~/lib/haptics';

export { HapticFeedbackPattern, PerformanceTime };

export function useHaptics() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    checkSupported()
      .then((supported) => setSupported(supported))
      .catch(() => setSupported(false));
  }, []);

  const perform = useCallback(
    (
      pattern: HapticFeedbackPattern = HapticFeedbackPattern.Generic,
      performanceTime: PerformanceTime = PerformanceTime.Now,
    ) => {
      if (supported) {
        performHaptic(pattern, performanceTime);
      }
    },
    [supported],
  );

  return { perform, supported };
}
