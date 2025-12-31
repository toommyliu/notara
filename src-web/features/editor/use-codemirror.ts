import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import * as React from 'react';

import { editorTheme } from './editor-theme';
import { livePreview, livePreviewTheme } from './live-preview';

interface UseCodeMirrorOptions {
  initialValue: string;
  onChange?: (value: string) => void;
}

export function useCodeMirror({ initialValue, onChange }: UseCodeMirrorOptions) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const viewRef = React.useRef<EditorView | null>(null);
  const onChangeRef = React.useRef(onChange);

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    if (!containerRef.current)
      return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && onChangeRef.current) {
        onChangeRef.current(update.state.doc.toString());
      }
    });

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown({ codeLanguages: languages }),
        editorTheme,
        livePreview,
        livePreviewTheme,
        updateListener,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

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

  return { containerRef };
}
