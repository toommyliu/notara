import { EditorView } from '@codemirror/view';

export const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '16px',
    // fontFamily: 'ui-sans-serif, -apple-system, "system-ui", "Segoe UI", Roboto, Inter, sans-serif',
  },
  '.cm-content': {
    padding: '3rem',
    lineHeight: '1.6',
    caretColor: 'var(--foreground)',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-line': {
    padding: '0',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--highlight) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--highlight) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
}, { dark: false });

export const editorThemeDark = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '16px',
    fontFamily: 'ui-sans-serif, -apple-system, "system-ui", "Segoe UI", Roboto, Inter, sans-serif',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
  },
  '.cm-content': {
    padding: '3rem',
    lineHeight: '1.6',
    caretColor: 'var(--foreground)',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-line': {
    padding: '0',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--highlight) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'var(--highlight) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
}, { dark: true });
