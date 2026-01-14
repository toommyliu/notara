export type SplitDropZone = 'left' | 'right' | 'top' | 'bottom' | 'center';

export type SplitOrientation = 'horizontal' | 'vertical';

/**
 * Converts drop zone to corresponding orientation
 * @param zone - the drop zone
 * @returns the orientation or null if the zone is center
 */
export function getOrientationFromZone(
  zone: SplitDropZone,
): SplitOrientation | null {
  switch (zone) {
    case 'left':
    case 'right':
      return 'vertical';
    case 'top':
    case 'bottom':
      return 'horizontal';
    case 'center':
      return null;
  }
}

/**
 * Determines if the dragged tab should be placed in the first pane
 * @param zone - the drop zone
 * @returns true if dragged tab should be first (left/top), false if second (right/bottom)
 */
export function isDraggedTabFirst(zone: SplitDropZone): boolean {
  return zone === 'left' || zone === 'top';
}
