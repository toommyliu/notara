export interface HeaderTabItemHandle {
  focus: () => void
}

export interface HeaderTabItemProps {
  noteId: string
  isActive: boolean
  isPinned: boolean
  onActivate: () => void
  onClose: () => void
  compact?: boolean
}

export type SplitTabItemProps = HeaderTabItemProps & {
  noteIds: string[]
  onActivatePane: (noteId: string) => void
  onClosePane: (noteId: string) => void
}
