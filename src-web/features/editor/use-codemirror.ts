import type { WordCountStats } from './word-count';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import * as React from 'react';

import { editorTheme } from './editor-theme';
import { livePreview, livePreviewClickHandler, livePreviewTheme } from './live-preview';
import { wordCountField } from './word-count';

interface UseCodeMirrorOptions {
  initialValue: string;
  onChange?: (value: string) => void;
}

const defaultStats: WordCountStats = { words: 0, characters: 0, charactersNoSpaces: 0 };

export function useCodeMirror({ initialValue, onChange }: UseCodeMirrorOptions) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewRef = React.useRef<EditorView | null>(null);
  const onChangeRef = React.useRef(onChange);
  const statsRef = React.useRef<WordCountStats>(defaultStats);
  const [stats, setStats] = React.useState<WordCountStats>(defaultStats);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    if (!containerRef.current)
      return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        if (onChangeRef.current) {
          onChangeRef.current(update.state.doc.toString());
        }

        setStats(update.state.field(wordCountField));
      }
    });

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        editorTheme,
        livePreview,
        livePreviewClickHandler,
        livePreviewTheme,
        updateListener,
        wordCountField,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    const initialStats = view.state.field(wordCountField);
    statsRef.current = initialStats;
    setStats(initialStats);

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const view = viewRef.current;
    if (!view)
      return;

    const currentValue = view.state.doc.toString();
    if (currentValue !== initialValue) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: initialValue,
        },
      });
    }
  }, [initialValue]);

  return { containerRef, stats };
}
