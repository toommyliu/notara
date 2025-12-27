import {
  FontBackgroundColorPlugin,
  FontColorPlugin,
  FontFamilyPlugin,
  FontSizePlugin,
} from '@platejs/basic-styles/react';

// FontColorPlugin and FontBackgroundColorPlugin are inline mark plugins that apply
// styles directly to text nodes. They don't need inject.targetPlugins configuration
// (that's only for block-level style injection like text-align).
//
// The plugins automatically apply 'color' and 'background-color' CSS inline styles
// to text leaves when marks are added.
export const BaseFontKit = [
  FontColorPlugin,
  FontBackgroundColorPlugin,
  FontSizePlugin,
  FontFamilyPlugin,
];
