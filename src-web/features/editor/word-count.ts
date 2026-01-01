import type { EditorState } from '@codemirror/state';
import { StateField } from '@codemirror/state';

export interface WordCountStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
}

function countStats(text: string): WordCountStats {
  const trimmed = text.trim();
  const words = trimmed.length === 0
    ? 0
    : trimmed.split(/\s+/).filter(w => w.length > 0).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  return { words, characters, charactersNoSpaces };
}

function computeStats(state: EditorState): WordCountStats {
  return countStats(state.doc.toString());
}

export const wordCountField = StateField.define<WordCountStats>({
  create: computeStats,
  update(value, tr) {
    if (tr.docChanged) {
      return computeStats(tr.state);
    }

    return value;
  },
});
