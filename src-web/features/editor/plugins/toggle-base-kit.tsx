import { BaseTogglePlugin } from '@platejs/toggle'

import { ToggleElementStatic } from '~/features/editor/components/toggle-node-static'

export const BaseToggleKit = [
  BaseTogglePlugin.withComponent(ToggleElementStatic),
]
