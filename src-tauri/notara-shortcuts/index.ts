// AUTO-GENERATED - DO NOT EDIT

import type { ShortcutBinding } from './bindings/ShortcutBinding'
import type { ShortcutId } from './bindings/ShortcutId'

export type { Modifier } from './bindings/Modifier'
export type { ShortcutBinding } from './bindings/ShortcutBinding'
export type { ShortcutId } from './bindings/ShortcutId'

interface ShortcutDefinition {
  id: ShortcutId
  label: string
  default_binding: ShortcutBinding
  is_menu: boolean
}

const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    default_binding: {
      key: '\\',
      modifiers: [
        'meta',
      ],
    },
    is_menu: true,
  },
  {
    id: 'toggle-tab-bar',
    label: 'Toggle Tab Bar',
    default_binding: {
      key: 'b',
      modifiers: [
        'meta',
      ],
    },
    is_menu: false,
  },
  {
    id: 'cycle-tab-forward',
    label: 'Next Tab',
    default_binding: {
      key: 'Tab',
      modifiers: [
        'ctrl',
      ],
    },
    is_menu: false,
  },
  {
    id: 'cycle-tab-backward',
    label: 'Previous Tab',
    default_binding: {
      key: 'Tab',
      modifiers: [
        'ctrl',
        'shift',
      ],
    },
    is_menu: false,
  },
  {
    id: 'cycle-pane-forward',
    label: 'Next Pane',
    default_binding: {
      key: ']',
      modifiers: [
        'alt',
      ],
    },
    is_menu: false,
  },
  {
    id: 'cycle-pane-backward',
    label: 'Previous Pane',
    default_binding: {
      key: '[',
      modifiers: [
        'alt',
      ],
    },
    is_menu: false,
  },
  {
    id: 'new-note',
    label: 'New Note',
    default_binding: {
      key: 'n',
      modifiers: [
        'meta',
      ],
    },
    is_menu: true,
  },
  {
    id: 'open-settings',
    label: 'Settings',
    default_binding: {
      key: ',',
      modifiers: [
        'meta',
      ],
    },
    is_menu: true,
  },
]

export const SHORTCUT_LABELS: Record<ShortcutId, string> = Object.fromEntries(
  SHORTCUT_DEFINITIONS.map(s => [s.id, s.label]),
) as Record<ShortcutId, string>

export const DEFAULT_BINDINGS: Record<ShortcutId, ShortcutBinding> = Object.fromEntries(
  SHORTCUT_DEFINITIONS.map(s => [s.id, s.default_binding]),
) as Record<ShortcutId, ShortcutBinding>

export const MENU_SHORTCUTS: ShortcutId[] = SHORTCUT_DEFINITIONS
  .filter(s => s.is_menu)
  .map(s => s.id)

export const ALL_SHORTCUT_IDS: ShortcutId[] = SHORTCUT_DEFINITIONS.map(s => s.id)
