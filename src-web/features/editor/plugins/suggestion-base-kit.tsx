import { BaseSuggestionPlugin } from '@platejs/suggestion'

import { SuggestionLeafStatic } from '~/features/editor/components/suggestion-node-static'

export const BaseSuggestionKit = [
  BaseSuggestionPlugin.withComponent(SuggestionLeafStatic),
]
