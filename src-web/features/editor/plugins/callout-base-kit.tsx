import { BaseCalloutPlugin } from '@platejs/callout'

import { CalloutElementStatic } from '~/features/editor/components/callout-node-static'

export const BaseCalloutKit = [
  BaseCalloutPlugin.withComponent(CalloutElementStatic),
]
