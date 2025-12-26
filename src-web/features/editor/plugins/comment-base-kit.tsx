import { BaseCommentPlugin } from '@platejs/comment';

import { CommentLeafStatic } from '~/features/editor/components/comment-node-static';

export const BaseCommentKit = [
  BaseCommentPlugin.withComponent(CommentLeafStatic),
];
