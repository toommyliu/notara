'use client'

import { createPlatePlugin } from 'platejs/react'

import { FloatingToolbar } from '~/features/editor/components/floating-toolbar'
import { FloatingToolbarButtons } from '~/features/editor/components/floating-toolbar-buttons'

export const FloatingToolbarKit = [
  createPlatePlugin({
    key: 'floating-toolbar',
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      ),
    },
  }),
]
