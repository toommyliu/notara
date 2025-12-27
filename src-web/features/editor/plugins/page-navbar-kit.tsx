'use client';

import { createPlatePlugin } from 'platejs/react';

import { PageNavBar } from '~/features/editor/components/page-navbar';
import { useEditorUi } from '~/features/editor/contexts/editor-ui-context';

function ConnectedPageNavBar() {
  const { noteTitle, noteEmoji } = useEditorUi();

  return <PageNavBar title={noteTitle} icon={noteEmoji} />;
}

export const PageNavBarKit = [
  createPlatePlugin({
    key: 'page-nav-bar',
    render: {
      beforeEditable: () => <ConnectedPageNavBar />,
    },
  }),
];
