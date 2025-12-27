import IconSettings from '~icons/lucide/settings';

import { useSettingsStore } from '~/features/settings/stores/settings-store';

import { useIsMacOS } from '~/hooks/use-platform';
import { SidebarMenuButton } from '~/ui/sidebar';

export function SettingsTrigger() {
  const { open } = useSettingsStore();

  const isMacOS = useIsMacOS();
  const tooltip = isMacOS ? 'Settings (⌘,)' : 'Settings (Ctrl,)';

  return (
    <SidebarMenuButton tooltip={tooltip} onClick={open}>
      <IconSettings className="size-4" />
      <span>Settings</span>
    </SidebarMenuButton>
  );
}
