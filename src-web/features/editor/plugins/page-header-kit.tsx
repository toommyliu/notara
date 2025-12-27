'use client';

import { createPlatePlugin } from 'platejs/react';

import { PageHeader } from '~/features/editor/components/page-header';

export const PageHeaderKit = [
  createPlatePlugin({
    key: 'page-header',
    render: {
      beforeEditable: () => <PageHeader />,
    },
  }),
];
