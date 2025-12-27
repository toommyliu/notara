'use client';

import { TogglePlugin } from '@platejs/toggle/react';

import { ToggleElement } from '~/features/editor/components/toggle-node';
import { IndentKit } from '~/features/editor/plugins/indent-kit';

export const ToggleKit = [
  ...IndentKit,
  TogglePlugin.withComponent(ToggleElement),
];
