import { BaseEquationPlugin, BaseInlineEquationPlugin } from '@platejs/math';

import {
  EquationElementStatic,
  InlineEquationElementStatic,
} from '~/features/editor/components/equation-node-static';

export const BaseMathKit = [
  BaseInlineEquationPlugin.withComponent(InlineEquationElementStatic),
  BaseEquationPlugin.withComponent(EquationElementStatic),
];
