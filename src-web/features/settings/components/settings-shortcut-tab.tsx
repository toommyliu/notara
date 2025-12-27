import type { Modifier, ShortcutBinding, ShortcutId } from '@notara/shortcuts'
import {
  SHORTCUT_LABELS,

} from '@notara/shortcuts'

import { useCallback, useEffect, useState } from 'react'

import IconRotateCcw from '~icons/lucide/rotate-ccw'
import { formatBindingForDisplay, useShortcutsStore } from '~/features/settings/stores/shortcuts-store'
import { getKeyFromEvent } from '~/lib/keyboard'

import { cn } from '~/lib/utils'

interface ShortcutRowProps {
  id: ShortcutId
  binding: ShortcutBinding
  isRecording: boolean
  onStartRecording: () => void
  onCancelRecording: () => void
}

function ShortcutRow({ id, binding, isRecording, onStartRecording, onCancelRecording }: ShortcutRowProps) {
  const { setBinding } = useShortcutsStore()

  useEffect(() => {
    if (!isRecording)
      return

    const handleKeyDown = (ev: KeyboardEvent) => {
      ev.preventDefault()
      ev.stopPropagation()

      if (ev.key === 'Escape') {
        onCancelRecording()
        return
      }

      // Ignore modifier-only presses
      if (['Meta', 'Control', 'Shift', 'Alt'].includes(ev.key)) {
        return
      }

      const modifiers: Modifier[] = []
      if (ev.metaKey)
        modifiers.push('meta')
      if (ev.ctrlKey)
        modifiers.push('ctrl')
      if (ev.shiftKey)
        modifiers.push('shift')
      if (ev.altKey)
        modifiers.push('alt')

      // Require at least one modifier for most keys
      const isFunctionKey = /^F([1-9]|1[0-2])$/.test(ev.key)
      if (modifiers.length === 0 && !isFunctionKey) {
        return
      }

      const key = getKeyFromEvent(ev)

      // Skip if still a modifier or invalid
      if (['Meta', 'Control', 'Shift', 'Alt', 'Dead'].includes(key)) {
        return
      }

      setBinding(id, { key, modifiers })
      onCancelRecording()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isRecording, id, setBinding, onCancelRecording])

  const label = SHORTCUT_LABELS[id]
  const displayText = isRecording ? 'Press shortcut... (Esc to cancel)' : formatBindingForDisplay(binding)

  return (
    <div className="flex items-center justify-between py-2">
      <span id={`shortcut-label-${id}`} className="text-sm text-foreground">
        {label}
      </span>
      <button
        aria-labelledby={`shortcut-label-${id}`}
        aria-pressed={isRecording}
        onClick={isRecording ? onCancelRecording : onStartRecording}
        className={cn(
          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
          'border shadow-sm',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          isRecording
            ? 'bg-accent border-foreground/20 text-foreground animate-pulse'
            : 'bg-muted/60 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        {displayText}
      </button>
    </div>
  )
}

export function ShortcutsTab() {
  const { bindings, resetToDefaults } = useShortcutsStore()
  const [recordingId, setRecordingId] = useState<ShortcutId | null>(null)

  const handleStartRecording = useCallback((id: ShortcutId) => {
    setRecordingId(id)
  }, [])

  const handleCancelRecording = useCallback(() => {
    setRecordingId(null)
  }, [])

  const shortcutIds = Object.keys(bindings) as ShortcutId[]

  return (
    <div className="space-y-3">
      <div className="bg-muted/30 rounded-xl p-3 border border-border/40">
        <div className="divide-y divide-border/40">
          {shortcutIds.map(id => (
            <ShortcutRow
              key={id}
              id={id}
              binding={bindings[id]}
              isRecording={recordingId === id}
              onStartRecording={() => handleStartRecording(id)}
              onCancelRecording={handleCancelRecording}
            />
          ))}
        </div>

        <button
          onClick={() => {
            resetToDefaults()
            setRecordingId(null)
          }}
          className={cn(
            'mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium',
            'text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          )}
        >
          <IconRotateCcw className="size-3.5" />
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}
