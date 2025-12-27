'use client'

import { createPlatePlugin } from 'platejs/react'

import { PageHeader } from '~/features/editor/components/page-header'
import { useEditorUi } from '~/features/editor/contexts/editor-ui-context'

function ConnectedPageHeader() {
  const { pageIcon, setPageIcon, coverUrl, setCoverUrl } = useEditorUi()

  return (
    <PageHeader
      icon={pageIcon}
      coverUrl={coverUrl ?? undefined}
      onIconChange={setPageIcon}
      onCoverChange={setCoverUrl}
    />
  )
}

export const PageHeaderKit = [
  createPlatePlugin({
    key: 'page-header',
    render: {
      beforeEditable: () => <ConnectedPageHeader />,
    },
  }),
]
