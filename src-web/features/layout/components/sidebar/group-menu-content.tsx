import type { Group, SortOrder } from '~/features/notes/store';

import IconArrowDownAZ from '~icons/lucide/arrow-down-a-z';
import IconArrowUpZA from '~icons/lucide/arrow-up-z-a';
import IconCheck from '~icons/lucide/check';
import IconInfinity from '~icons/lucide/infinity';
import IconListOrdered from '~icons/lucide/list-ordered';
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

const DISPLAY_LIMITS = [
  { value: 5, label: 'Show 5 items' },
  { value: 10, label: 'Show 10 items' },
  { value: 20, label: 'Show 20 items' },
  { value: null, label: 'Show all' },
] as const;

const SORT_OPTIONS: {
  value: SortOrder;
  label: string;
  icon: typeof IconArrowDownAZ;
}[] = [
  { value: 'manual', label: 'Manual', icon: IconListOrdered },
  { value: 'a-z', label: 'A → Z', icon: IconArrowDownAZ },
  { value: 'z-a', label: 'Z → A', icon: IconArrowUpZA },
];

interface GroupMenuContentProps {
  group: Group;
  variant: 'context' | 'dropdown';
}

export function GroupMenuContent({ group, variant }: GroupMenuContentProps) {
  const sortGroup = useNotesStore(s => s.sortGroup);
  const setGroupDisplayLimit = useNotesStore(s => s.setGroupDisplayLimit);

  const Item = variant === 'context' ? ContextMenuItem : DropdownMenuItem;
  const Separator
    = variant === 'context' ? ContextMenuSeparator : DropdownMenuSeparator;
  const Sub = variant === 'context' ? ContextMenuSub : DropdownMenuSub;
  const SubTrigger
    = variant === 'context' ? ContextMenuSubTrigger : DropdownMenuSubTrigger;
  const SubContent
    = variant === 'context' ? ContextMenuSubContent : DropdownMenuSubContent;

  return (
    <>
      <span className="text-muted-foreground px-2 py-1 text-xs font-medium select-none">
        Sort by
      </span>
      {SORT_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = group.sortOrder === option.value;
        return (
          <Item
            key={option.value}
            onClick={() => sortGroup(group.id, option.value)}
          >
            <Icon className="size-4" />
            {option.label}
            {isActive && (
              <IconCheck className="size-3.5 ml-auto text-primary" />
            )}
          </Item>
        );
      })}
      <Separator />
      <Sub>
        <SubTrigger>
          <IconListOrdered className="size-4" />
          Display limit
        </SubTrigger>
        <SubContent>
          {DISPLAY_LIMITS.map((option) => {
            const isActive = group.displayLimit === option.value;
            return (
              <Item
                key={String(option.value)}
                onClick={() => setGroupDisplayLimit(group.id, option.value)}
              >
                {option.value === null
                  ? (
                      <IconInfinity className="size-4" />
                    )
                  : (
                      <span className="w-4 text-center text-xs font-medium text-muted-foreground">
                        {option.value}
                      </span>
                    )}
                {option.label}
                {isActive && (
                  <IconCheck className="size-3.5 ml-auto text-primary" />
                )}
              </Item>
            );
          })}
        </SubContent>
      </Sub>
    </>
  );
}
