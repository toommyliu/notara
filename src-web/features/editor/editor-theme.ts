import { EditorView } from '@codemirror/view';

export const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '16px',
    fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", sans-serif',
    backgroundColor: 'var(--background)',
    color: 'var(--foreground)',
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    overflow: 'visible',
  },
  '.cm-content': {
    fontFamily: 'inherit',
    paddingTop: '0',
    paddingRight: '3rem',
    paddingBottom: '3rem',
    paddingLeft: '3rem',
    lineHeight: '24px',
    caretColor: 'var(--foreground)',
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
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
});
