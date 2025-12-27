import { BaseMentionPlugin } from '@platejs/mention';

import { MentionElementStatic } from '~/features/editor/components/mention-node-static';

export const BaseMentionKit = [
  BaseMentionPlugin.withComponent(MentionElementStatic),
];
