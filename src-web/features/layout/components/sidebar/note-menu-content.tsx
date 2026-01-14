import { useNavigate } from '@tanstack/react-router';

import IconAppWindow from '~icons/lucide/app-window';
import IconCopy from '~icons/lucide/copy';
import IconExternalLink from '~icons/lucide/external-link';
import IconFolderInput from '~icons/lucide/folder-input';
import IconPanelRight from '~icons/lucide/panel-right';
import IconPencil from '~icons/lucide/pencil';
import IconStar from '~icons/lucide/star';
import IconTrash from '~icons/lucide/trash-2';
import { useTabsStore } from '~/features/layout/stores/tabs-store';
import { useNotesStore } from '~/features/notes/store';
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '~/ui/context-menu';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '~/ui/dropdown-menu';

interface NoteMenuContentProps {
  noteId: string;
  groupId: string | null;
  variant: 'context' | 'dropdown';
}

export function NoteMenuContent({ noteId, groupId, variant }: NoteMenuContentProps) {
  const navigate = useNavigate();
  const groups = useNotesStore(s => s.groups);
  const duplicateNote = useNotesStore(s => s.duplicateNote);
  const deleteNote = useNotesStore(s => s.deleteNote);
  const moveNote = useNotesStore(s => s.moveNote);

  const openNote = useTabsStore(s => s.openNote);

  const Item = variant === 'context' ? ContextMenuItem : DropdownMenuItem;
  const Separator
    = variant === 'context' ? ContextMenuSeparator : DropdownMenuSeparator;
  const Sub = variant === 'context' ? ContextMenuSub : DropdownMenuSub;
  const SubTrigger
    = variant === 'context' ? ContextMenuSubTrigger : DropdownMenuSubTrigger;
  const SubContent
    = variant === 'context' ? ContextMenuSubContent : DropdownMenuSubContent;

  const handleDuplicate = () => {
    const newId = duplicateNote(noteId);
    if (newId) {
      openNote(newId);
      navigate({ to: '/notes' });
    }
  };

  const handleDelete = () => {
    deleteNote(noteId);
  };

  const handleOpenInNewTab = () => {
    openNote(noteId);
    navigate({ to: '/notes' });
  };

  const handleMoveToGroup = (targetGroupId: string) => {
    if (groupId && groupId !== targetGroupId) {
      moveNote(noteId, groupId, targetGroupId);
    }
  };

  const availableGroups = groups.filter(g => g.id !== groupId);

  return (
    <>
      <Item disabled>
        <IconStar className="size-4" />
        Add to Favorites
      </Item>
      <Item onClick={handleDuplicate}>
        <IconCopy className="size-4" />
        Duplicate
      </Item>
      <Item disabled>
        <IconPencil className="size-4" />
        Rename
      </Item>
      <Separator />
      <Sub>
        <SubTrigger>
          <IconFolderInput className="size-4" />
          Move to
        </SubTrigger>
        <SubContent>
          {availableGroups.length > 0
            ? (
                availableGroups.map(g => (
                  <Item key={g.id} onClick={() => handleMoveToGroup(g.id)}>
                    {g.title}
                  </Item>
                ))
              )
            : (
                <Item disabled>No other groups</Item>
              )}
        </SubContent>
      </Sub>
      <Item variant="destructive" onClick={handleDelete}>
        <IconTrash className="size-4" />
        Move to Trash
      </Item>
      <Separator />
      <Item onClick={handleOpenInNewTab}>
        <IconExternalLink className="size-4" />
        Open in New Tab
      </Item>
      <Item disabled>
        <IconAppWindow className="size-4" />
        Open in New Window
      </Item>

      <Item disabled>
        <IconPanelRight className="size-4" />
        Open in Side Peek
      </Item>
    </>
  );
}
