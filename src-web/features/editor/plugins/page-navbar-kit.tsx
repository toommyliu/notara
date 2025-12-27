'use client'

import { createPlatePlugin } from 'platejs/react'

import { PageNavBar } from '~/features/editor/components/page-navbar'

export const PageNavBarKit = [
  createPlatePlugin({
    key: 'page-nav-bar',
    render: {
      beforeEditable: () => <PageNavBar />,
    },
  }),
]
