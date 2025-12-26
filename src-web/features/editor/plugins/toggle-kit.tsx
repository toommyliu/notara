'use client';

import { TogglePlugin } from '@platejs/toggle/react';

import { IndentKit } from '~/features/editor/plugins/indent-kit';
import { ToggleElement } from '~/features/editor/components/toggle-node';

export const ToggleKit = [
  ...IndentKit,
  TogglePlugin.withComponent(ToggleElement),
];
