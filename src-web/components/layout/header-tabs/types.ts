export type HeaderTabItemHandle = {
    focus: () => void;
};

export type HeaderTabItemProps = {
    noteId: string;
    isActive: boolean;
    isPinned: boolean;
    onActivate: () => void;
    onClose: () => void;
    compact?: boolean;
};

export type SplitTabItemProps = HeaderTabItemProps & {
    noteIds: string[];
    onActivatePane: (noteId: string) => void;
};
