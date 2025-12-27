'use client'

import { createPlatePlugin } from 'platejs/react'

import { FixedToolbar } from '~/features/editor/components/fixed-toolbar'
import { FixedToolbarButtons } from '~/features/editor/components/fixed-toolbar-buttons'

export const FixedToolbarKit = [
  createPlatePlugin({
    key: 'fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbar>
          <FixedToolbarButtons />
        </FixedToolbar>
      ),
    },
  }),
]
