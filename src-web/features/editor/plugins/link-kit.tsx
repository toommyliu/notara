'use client'

import { LinkPlugin } from '@platejs/link/react'

import { LinkElement } from '~/features/editor/components/link-node'
import { LinkFloatingToolbar } from '~/features/editor/components/link-toolbar'

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
]
