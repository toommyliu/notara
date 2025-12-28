import IconSettings from '~icons/lucide/settings';

import { useSettingsStore } from '~/features/settings/stores/settings-store';

import { getModKeyLabel } from '~/hooks/use-platform';
import { SidebarMenuButton } from '~/ui/sidebar';

export function SettingsTrigger() {
  const open = useSettingsStore((s) => s.open);

  const tooltip = `Settings (${getModKeyLabel()},)`;

  return (
    <SidebarMenuButton tooltip={tooltip} onClick={open}>
      <IconSettings className="size-4" />
      <span>Settings</span>
    </SidebarMenuButton>
  );
}
