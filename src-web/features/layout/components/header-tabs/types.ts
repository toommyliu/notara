import type { PaneId } from '~/features/layout/stores/tabs-store';

export interface HeaderTabItemHandle {
  focus: () => void;
}

export interface HeaderTabItemProps {
  noteId: string;
  paneId: PaneId;
  isActive: boolean;
  isPinned: boolean;
  onActivate: () => void;
  onClose: () => void;
  compact?: boolean;
}
