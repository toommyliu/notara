'use client';

import { CaptionPlugin } from '@platejs/caption/react';
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
} from '@platejs/media/react';
import { KEYS } from 'platejs';

import { AudioElement } from '~/features/editor/components/media-audio-node';
import { MediaEmbedElement } from '~/features/editor/components/media-embed-node';
import { FileElement } from '~/features/editor/components/media-file-node';
import { ImageElement } from '~/features/editor/components/media-image-node';
import { PlaceholderElement } from '~/features/editor/components/media-placeholder-node';
import { MediaPreviewDialog } from '~/features/editor/components/media-preview-dialog';
import { MediaUploadToast } from '~/features/editor/components/media-upload-toast';

export const MediaKit = [
  ImagePlugin.configure({
    options: { disableUploadInsert: true },
    render: { afterEditable: MediaPreviewDialog, node: ImageElement },
  }),
  MediaEmbedPlugin.withComponent(MediaEmbedElement),
  AudioPlugin.withComponent(AudioElement),
  FilePlugin.withComponent(FileElement),
  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: true },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
];
