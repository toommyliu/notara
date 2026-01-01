import type { Range } from '@codemirror/state';
import type {
  DecorationSet,
  ViewUpdate,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
} from '@codemirror/view';

const INLINE_FORMATS: Record<string, { class: string; markerLen: number }> = {
  StrongEmphasis: { class: 'cm-md-bold', markerLen: 2 },
  Emphasis: { class: 'cm-md-italic', markerLen: 1 },
  InlineCode: { class: 'cm-md-code', markerLen: 1 },
  Strikethrough: { class: 'cm-md-strikethrough', markerLen: 2 },
};

const HEADING_CLASSES: Record<string, string> = {
  ATXHeading1: 'cm-md-h1',
  ATXHeading2: 'cm-md-h2',
  ATXHeading3: 'cm-md-h3',
  ATXHeading4: 'cm-md-h4',
  ATXHeading5: 'cm-md-h5',
  ATXHeading6: 'cm-md-h6',
};

class CheckboxWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    readonly pos: number,
  ) {
    super();
  }

  toDOM(view: EditorView) {
    const wrapper = document.createElement('span');
    wrapper.className = 'cm-md-checkbox-wrapper';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = this.checked;
    input.className = 'cm-md-checkbox';
    input.setAttribute('aria-label', this.checked ? 'Completed task' : 'Incomplete task');

    input.addEventListener('mousedown', (ev) => {
      ev.preventDefault();
      const replacement = this.checked ? '[ ]' : '[x]';
      view.dispatch({
        changes: { from: this.pos, to: this.pos + 3, insert: replacement },
      });
    });

    wrapper.appendChild(input);
    return wrapper;
  }

  eq(other: CheckboxWidget) {
    return this.checked === other.checked && this.pos === other.pos;
  }

  ignoreEvent() {
    return false;
  }
}

function getDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const cursorPos = view.state.selection.main.head;
  const cursorLine = view.state.doc.lineAt(cursorPos).number;

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        // Handle list markers - style them when on the line
        if (node.name === 'ListMark') {
          decorations.push(
            Decoration.mark({ class: 'cm-md-list-marker' }).range(node.from, node.to),
          );
        }

        // Handle task list checkboxes
        if (node.name === 'TaskMarker') {
          const nodeLine = view.state.doc.lineAt(node.from).number;
          const cursorOnLine = cursorLine === nodeLine;
          const text = view.state.sliceDoc(node.from, node.to);
          const isChecked = text.includes('x') || text.includes('X');
          const line = view.state.doc.lineAt(node.from);

          if (!cursorOnLine) {
            // Replace TaskMarker with checkbox widget
            decorations.push(
              Decoration.replace({
                widget: new CheckboxWidget(isChecked, node.from),
              }).range(node.from, node.to),
            );
          }
          else {
            // Style the task marker when editing
            decorations.push(
              Decoration.mark({ class: 'cm-md-task-marker' }).range(node.from, node.to),
            );
          }

          if (isChecked) {
            decorations.push(
              Decoration.mark({ class: 'cm-md-task-checked' }).range(node.to, line.to),
            );
          }
        }

        // Handle inline formatting (bold, italic, code, strikethrough)
        const inlineFormat = INLINE_FORMATS[node.name];
        if (inlineFormat) {
          const nodeFrom = node.from;
          const nodeTo = node.to;
          const contentFrom = nodeFrom + inlineFormat.markerLen;
          const contentTo = nodeTo - inlineFormat.markerLen;

          // Style the content
          if (contentTo > contentFrom) {
            decorations.push(
              Decoration.mark({ class: inlineFormat.class }).range(contentFrom, contentTo),
            );
          }

          // Style the markers as muted
          decorations.push(
            Decoration.mark({ class: 'cm-md-syntax' }).range(nodeFrom, contentFrom),
          );
          decorations.push(
            Decoration.mark({ class: 'cm-md-syntax' }).range(contentTo, nodeTo),
          );

          return;
        }

        // Handle headings
        const headingClass = HEADING_CLASSES[node.name];
        if (headingClass) {
          // Style the entire heading including the # marks
          decorations.push(
            Decoration.mark({ class: headingClass }).range(node.from, node.to),
          );

          // Find and mute the HeaderMark
          const child = node.node.firstChild;
          if (child?.name === 'HeaderMark') {
            decorations.push(
              Decoration.mark({ class: 'cm-md-syntax' }).range(child.from, child.to),
            );
          }

          return false;
        }

        // Handle blockquotes
        if (node.name === 'Blockquote') {
          decorations.push(
            Decoration.mark({ class: 'cm-md-blockquote' }).range(node.from, node.to),
          );

          // Find and mute the QuoteMark
          const child = node.node.firstChild;
          if (child && child.name === 'QuoteMark') {
            decorations.push(
              Decoration.mark({ class: 'cm-md-syntax' }).range(child.from, child.to),
            );
          }
        }

        // Handle links - style the whole link, mute the syntax
        if (node.name === 'Link') {
          let linkTextFrom = -1;
          let linkTextTo = -1;

          node.node.cursor().iterate((child) => {
            if (child.name === 'LinkLabel') {
              linkTextFrom = child.from + 1; // Skip [
              linkTextTo = child.to - 1; // Skip ]
            }
          });

          if (linkTextFrom >= 0 && linkTextTo > linkTextFrom) {
            // Style the link text
            decorations.push(
              Decoration.mark({ class: 'cm-md-link' }).range(linkTextFrom, linkTextTo),
            );

            // Mute the syntax parts
            decorations.push(
              Decoration.mark({ class: 'cm-md-syntax' }).range(node.from, linkTextFrom),
            );
            decorations.push(
              Decoration.mark({ class: 'cm-md-syntax' }).range(linkTextTo, node.to),
            );
          }
        }

        // Handle horizontal rules
        if (node.name === 'HorizontalRule') {
          decorations.push(
            Decoration.mark({ class: 'cm-md-hr' }).range(node.from, node.to),
          );
        }

        // Handle fenced code blocks with line decorations
        if (node.name === 'FencedCode') {
          const startLine = view.state.doc.lineAt(node.from);
          const endLine = view.state.doc.lineAt(node.to);

          let language = '';
          node.node.cursor().iterate((child) => {
            if (child.name === 'CodeInfo')
              language = view.state.doc.sliceString(child.from, child.to).trim();
          });

          // Apply line decoration to all lines in the codeblock
          for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
            const line = view.state.doc.line(lineNum);
            const totalLines = endLine.number - startLine.number + 1;

            let lineClass = 'cm-md-codeblock-line';

            if (totalLines === 1) {
              lineClass += ' cm-md-codeblock-single';
            }
            else if (lineNum === startLine.number) {
              lineClass += ' cm-md-codeblock-first';
            }
            else if (lineNum === endLine.number) {
              lineClass += ' cm-md-codeblock-last';
            }
            else {
              lineClass += ' cm-md-codeblock-middle';
            }

            decorations.push(
              Decoration.line({
                class: lineClass,
                attributes: (lineNum === startLine.number && language)
                  ? { 'data-language': language }
                  : {},
              }).range(line.from),
            );
          }

          return false;
        }
      },
    });
  }

  decorations.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide);

  const builder = new RangeSetBuilder<Decoration>();
  for (const deco of decorations)
    builder.add(deco.from, deco.to, deco.value);

  return builder.finish();
}

export const livePreview = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = getDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.decorations = getDecorations(update.view);
      }
    }
  },
  {
    decorations: v => v.decorations,
  },
);

export const livePreviewTheme = EditorView.baseTheme({
  '.cm-md-syntax': {
    color: 'var(--muted-foreground)',
    opacity: '0.5',
  },
  '.cm-md-checkbox-wrapper': {
    display: 'inline-flex',
    alignItems: 'center',
    verticalAlign: 'middle',
    height: '100%',
  },
  '.cm-md-checkbox': {
    appearance: 'none',
    WebkitAppearance: 'none',
    width: '1.05em',
    height: '1.05em',
    border: '1px solid var(--border)',
    borderRadius: '0.25em',
    marginRight: '0.25em',
    cursor: 'pointer',
    position: 'relative',
    flexShrink: '0',
    transition: 'all 0.1s ease-in-out',
    transform: 'translateY(-0.1em)',
  },
  '.cm-md-checkbox:hover': {
    borderColor: 'var(--brand)',
    backgroundColor: 'color-mix(in srgb, var(--brand) 10%, transparent)',
  },
  '.cm-md-checkbox:checked': {
    backgroundColor: 'var(--brand)',
    borderColor: 'var(--brand)',
  },
  '.cm-md-checkbox:checked::after': {
    content: '""',
    position: 'absolute',
    left: '50%',
    top: '45%',
    width: '0.3em',
    height: '0.55em',
    border: 'solid white',
    borderWidth: '0 2px 2px 0',
    transform: 'translate(-50%, -50%) rotate(45deg)',
  },
  '.cm-md-task-checked': {
    textDecoration: 'line-through',
    color: 'var(--muted-foreground)',
    opacity: '0.8',
    transition: 'opacity 0.2s ease',
  },
  '.cm-md-bold': {
    fontWeight: '700',
  },
  '.cm-md-italic': {
    fontStyle: 'italic',
  },
  '.cm-md-code': {
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Monaco, monospace',
    backgroundColor: 'var(--muted)',
    padding: '0.125rem 0.25rem',
    borderRadius: '0.25rem',
  },
  '.cm-md-strikethrough': {
    textDecoration: 'line-through',
  },
  '.cm-md-h1': {
    fontSize: '2em',
    fontWeight: '700',
    lineHeight: '1.2',
  },
  '.cm-md-h2': {
    fontSize: '1.5em',
    fontWeight: '700',
    lineHeight: '1.3',
  },
  '.cm-md-h3': {
    fontSize: '1.25em',
    fontWeight: '600',
    lineHeight: '1.4',
  },
  '.cm-md-h4': {
    fontSize: '1.1em',
    fontWeight: '600',
  },
  '.cm-md-h5': {
    fontSize: '1em',
    fontWeight: '600',
  },
  '.cm-md-h6': {
    fontSize: '0.9em',
    fontWeight: '600',
    color: 'var(--muted-foreground)',
  },
  '.cm-md-blockquote': {
    borderLeft: '3px solid var(--border)',
    paddingLeft: '1em',
    color: 'var(--muted-foreground)',
    fontStyle: 'italic',
  },
  '.cm-md-link': {
    color: 'var(--brand)',
    textDecoration: 'underline',
  },
  '.cm-md-hr': {
    display: 'block',
    textAlign: 'center',
    color: 'var(--muted-foreground)',
    opacity: '0.5',
  },
  '.cm-md-list-marker': {
    color: 'var(--muted-foreground)',
  },
  '.cm-md-task-marker': {
    color: 'var(--muted-foreground)',
  },
  '.cm-md-codeblock-line': {
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Monaco, monospace',
    fontSize: '0.875em',
    lineHeight: '1.65',
    backgroundColor: 'var(--muted)',
    paddingLeft: '1.5rem !important',
    paddingRight: '1.5rem !important',
    position: 'relative',
  },
  '.cm-md-codeblock-first': {
    paddingTop: '1rem !important',
    borderTopLeftRadius: '0.625rem',
    borderTopRightRadius: '0.625rem',
    marginTop: '0.75rem',
  },
  '.cm-md-codeblock-first::after': {
    content: 'attr(data-language)',
    position: 'absolute',
    top: '0.75rem',
    right: '1rem',
    fontSize: '0.65em',
    color: 'var(--muted-foreground)',
    textTransform: 'uppercase',
    fontWeight: '500',
    letterSpacing: '0.05em',
    opacity: '0.7',
    fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  '.cm-md-codeblock-last': {
    paddingBottom: '1rem !important',
    borderBottomLeftRadius: '0.625rem',
    borderBottomRightRadius: '0.625rem',
    marginBottom: '0.75rem',
  },
  '.cm-md-codeblock-middle': {
  },
  '.cm-md-codeblock-single': {
    paddingTop: '1rem !important',
    paddingBottom: '1rem !important',
    borderRadius: '0.625rem',
    marginTop: '0.75rem',
    marginBottom: '0.75rem',
  },
  '.cm-md-codeblock-single::after': {
    content: 'attr(data-language)',
    position: 'absolute',
    top: '0.75rem',
    right: '1rem',
    fontSize: '0.65em',
    color: 'var(--muted-foreground)',
    textTransform: 'uppercase',
    fontWeight: '500',
    letterSpacing: '0.05em',
    opacity: '0.7',
    fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif',
  },
});
