import { BaseLinkPlugin } from '@platejs/link'

import { LinkElementStatic } from '~/features/editor/components/link-node-static'

export const BaseLinkKit = [BaseLinkPlugin.withComponent(LinkElementStatic)]
