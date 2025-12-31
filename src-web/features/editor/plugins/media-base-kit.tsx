import { BaseCaptionPlugin } from '@platejs/caption';
import {
  BaseFilePlugin,
  BaseImagePlugin,
  BaseMediaEmbedPlugin,
  BasePlaceholderPlugin,
} from '@platejs/media';
import { KEYS } from 'platejs';

import { FileElementStatic } from '~/features/editor/components/media-file-node-static';
import { ImageElementStatic } from '~/features/editor/components/media-image-node-static';

export const BaseMediaKit = [
  BaseImagePlugin.withComponent(ImageElementStatic),
  BaseFilePlugin.withComponent(FileElementStatic),
  BaseCaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
  BaseMediaEmbedPlugin,
  BasePlaceholderPlugin,
];
