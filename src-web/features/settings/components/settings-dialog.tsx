import { useState } from 'react'

import IconKeyboard from '~icons/lucide/keyboard'

import IconPalette from '~icons/lucide/palette'
import { useSettingsStore } from '~/features/settings/stores/settings-store'

import { cn } from '~/lib/utils'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/ui/dialog'
import { GeneralTab } from './settings-general-tab'
import { ShortcutsTab } from './settings-shortcut-tab'

type SettingsTab = 'general' | 'shortcuts'

export function SettingsDialogContent() {
  const { isOpen, setOpen } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')

  const tabs: { id: SettingsTab, label: string, icon: typeof IconPalette }[] = [
    { id: 'general', label: 'General', icon: IconPalette },
    { id: 'shortcuts', label: 'Shortcuts', icon: IconKeyboard },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">Settings</DialogTitle>
          <DialogDescription>
            Customize your workspace preferences
          </DialogDescription>
        </DialogHeader>

        <div
          role="tablist"
          aria-label="Settings sections"
          className="flex gap-1 p-1 bg-muted/50 rounded-lg"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`settings-tabpanel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div
          role="tabpanel"
          id={`settings-tabpanel-${activeTab}`}
          className="flex-1 overflow-y-auto py-2"
        >
          {activeTab === 'general' && <GeneralTab />}
          {activeTab === 'shortcuts' && <ShortcutsTab />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
