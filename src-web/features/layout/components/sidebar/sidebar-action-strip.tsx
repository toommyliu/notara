import { useNavigate } from '@tanstack/react-router';

import IconArrowDownAZ from '~icons/lucide/arrow-down-a-z';
import IconFolderPlus from '~icons/lucide/folder-plus';
import IconAdd from '~icons/lucide/plus';
import { useTabsStore } from '~/features/layout/stores/tabs-store';
import { useNotesStore } from '~/features/notes/store';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/ui/tooltip';

export function SidebarActionStrip() {
  const addNote = useNotesStore(s => s.addNote);
  const addGroup = useNotesStore(s => s.addGroup);
  const sortData = useNotesStore(s => s.sortData);
  const openNote = useTabsStore(s => s.openNote);

  const navigate = useNavigate();

  const handleAddNote = () => {
    const id = addNote();
    openNote(id);
    navigate({ to: '/notes' });
  };

  return (
    <div className="flex items-center justify-center gap-1 py-1">
      <Tooltip>
        <TooltipTrigger
          onClick={handleAddNote}
          className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors duration-200 cursor-pointer"
        >
          <IconAdd className="size-4" />
          <span className="sr-only">New Page</span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          New Page
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          onClick={() => addGroup()}
          className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors duration-200 cursor-pointer"
        >
          <IconFolderPlus className="size-4" />
          <span className="sr-only">New Group</span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          New Group
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          onClick={sortData}
          className="flex items-center justify-center p-1 text-muted-foreground hover:text-foreground rounded-sm transition-colors duration-200 cursor-pointer"
        >
          <IconArrowDownAZ className="size-4" />
          <span className="sr-only">Sort</span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Sort Alphabetically
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
