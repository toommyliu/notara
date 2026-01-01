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

const HIDDEN_MARK = Decoration.mark({ class: 'cm-md-hidden' });

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
        // Handle list markers
        if (node.name === 'ListMark') {
          const nodeLine = view.state.doc.lineAt(node.from).number;
          const cursorOnLine = cursorLine === nodeLine;

          if (cursorOnLine) {
            decorations.push(
              Decoration.mark({ class: 'cm-md-list-marker' }).range(node.from, node.to),
            );
          }
        }

        // Handle task list checkboxes
        if (node.name === 'TaskMarker') {
          const nodeLine = view.state.doc.lineAt(node.from).number;
          const cursorOnLine = cursorLine === nodeLine;
          const text = view.state.sliceDoc(node.from, node.to);
          const isChecked = text.includes('x') || text.includes('X');

          // Find the list marker (- ) that precedes the TaskMarker
          const line = view.state.doc.lineAt(node.from);
          const lineText = line.text;
          const markerMatch = lineText.match(/^(\s*)([-*+])\s/);

          if (!cursorOnLine) {
            if (markerMatch) {
              const listMarkerStart = line.from + markerMatch[1].length;
              const listMarkerEnd = line.from + markerMatch[0].length;

              // Hide the list marker (- ) and replace TaskMarker with checkbox
              decorations.push(HIDDEN_MARK.range(listMarkerStart, listMarkerEnd));
              decorations.push(
                Decoration.replace({
                  widget: new CheckboxWidget(isChecked, node.from),
                }).range(node.from, node.to),
              );
            }
            else {
              // Fallback: just replace the TaskMarker
              decorations.push(
                Decoration.replace({
                  widget: new CheckboxWidget(isChecked, node.from),
                }).range(node.from, node.to),
              );
            }
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
          const cursorInside = cursorPos >= nodeFrom && cursorPos <= nodeTo;

          if (cursorInside) {
            decorations.push(
              Decoration.mark({ class: inlineFormat.class }).range(
                nodeFrom + inlineFormat.markerLen,
                nodeTo - inlineFormat.markerLen,
              ),
            );
          }
          else {
            decorations.push(HIDDEN_MARK.range(nodeFrom, nodeFrom + inlineFormat.markerLen));
            decorations.push(HIDDEN_MARK.range(nodeTo - inlineFormat.markerLen, nodeTo));
            decorations.push(
              Decoration.mark({ class: inlineFormat.class }).range(
                nodeFrom + inlineFormat.markerLen,
                nodeTo - inlineFormat.markerLen,
              ),
            );
          }
          return;
        }

        // Handle headings
        const headingClass = HEADING_CLASSES[node.name];
        if (headingClass) {
          const nodeLine = view.state.doc.lineAt(node.from).number;
          const cursorOnLine = cursorLine === nodeLine;

          let headerMarkFrom = -1;
          let headerMarkTo = -1;
          let contentFrom = node.from;

          // Find the HeaderMark child to get the # symbols
          const child = node.node.firstChild;
          if (child?.name === 'HeaderMark') {
            headerMarkFrom = child.from;
            headerMarkTo = child.to;
            // Content starts after HeaderMark and any whitespace
            contentFrom = headerMarkTo;
            // Skip whitespace after #
            const text = view.state.doc.sliceString(headerMarkTo, node.to);
            const leadingSpace = text.match(/^\s*/)?.[0].length ?? 0;
            contentFrom = headerMarkTo + leadingSpace;
          }

          if (cursorOnLine) {
            // Show raw syntax, style the entire line including # symbols
            decorations.push(
              Decoration.mark({ class: headingClass }).range(node.from, node.to),
            );
          }
          else {
            // Hide the # marks and style the whole line
            if (headerMarkFrom >= 0 && headerMarkTo > headerMarkFrom) {
              decorations.push(HIDDEN_MARK.range(headerMarkFrom, contentFrom));
            }

            if (contentFrom < node.to) {
              decorations.push(
                Decoration.mark({ class: headingClass }).range(contentFrom, node.to),
              );
            }
          }

          return false;
        }

        // Handle blockquotes
        if (node.name === 'Blockquote') {
          const nodeLine = view.state.doc.lineAt(node.from).number;
          const cursorOnLine = cursorLine === nodeLine;

          if (!cursorOnLine) {
            // Find QuoteMark child
            const child = node.node.firstChild;
            if (child && child.name === 'QuoteMark') {
              decorations.push(HIDDEN_MARK.range(child.from, child.to + 1)); // +1 for space
            }
          }

          decorations.push(
            Decoration.mark({ class: 'cm-md-blockquote' }).range(node.from, node.to),
          );
        }

        // Handle links
        if (node.name === 'Link') {
          const cursorInside = cursorPos >= node.from && cursorPos <= node.to;
          if (!cursorInside) {
            // Hide URL part, show only link text
            let linkTextFrom = -1;
            let linkTextTo = -1;

            node.node.cursor().iterate((child) => {
              if (child.name === 'LinkLabel') {
                linkTextFrom = child.from + 1; // Skip [
                linkTextTo = child.to - 1; // Skip ]
              }
            });

            if (linkTextFrom >= 0 && linkTextTo > linkTextFrom) {
              decorations.push(HIDDEN_MARK.range(node.from, linkTextFrom));
              decorations.push(HIDDEN_MARK.range(linkTextTo, node.to));
              decorations.push(
                Decoration.mark({ class: 'cm-md-link' }).range(linkTextFrom, linkTextTo),
              );
            }
          }
        }

        // Handle horizontal rules
        if (node.name === 'HorizontalRule') {
          const nodeLine = view.state.doc.lineAt(node.from).number;
          const cursorOnLine = cursorLine === nodeLine;
          if (!cursorOnLine) {
            decorations.push(
              Decoration.mark({ class: 'cm-md-hr' }).range(node.from, node.to),
            );
          }
        }

        // Handle fenced code blocks
        if (node.name === 'FencedCode') {
          const cursorInside = cursorPos >= node.from && cursorPos <= node.to;
          const startLine = view.state.doc.lineAt(node.from);
          const endLine = view.state.doc.lineAt(node.to);

          let language = '';
          node.node.cursor().iterate((child) => {
            if (child.name === 'CodeInfo')
              language = view.state.doc.sliceString(child.from, child.to).trim();
          });

          if (!cursorInside) {
            // Hide opening fence line completely (zero height)
            decorations.push(
              Decoration.line({ class: 'cm-md-codeblock-fence-hidden' }).range(startLine.from),
            );

            // Hide closing fence line completely
            if (endLine.number !== startLine.number) {
              decorations.push(
                Decoration.line({ class: 'cm-md-codeblock-fence-hidden' }).range(endLine.from),
              );
            }

            // Apply line decorations for each code line (between fences)
            const contentStartLine = startLine.number + 1;
            const contentEndLine = endLine.number - 1;
            const totalContentLines = contentEndLine - contentStartLine + 1;

            for (let lineNum = contentStartLine; lineNum <= contentEndLine; lineNum++) {
              const line = view.state.doc.line(lineNum);
              let lineClass = 'cm-md-codeblock-line cm-md-codeblock-middle';

              if (totalContentLines === 1)
                lineClass = 'cm-md-codeblock-line cm-md-codeblock-single';
              else if (lineNum === contentStartLine)
                lineClass = 'cm-md-codeblock-line cm-md-codeblock-first';
              else if (lineNum === contentEndLine)
                lineClass = 'cm-md-codeblock-line cm-md-codeblock-last';

              decorations.push(
                Decoration.line({
                  class: lineClass,
                  attributes: (lineNum === contentStartLine && language)
                    ? { 'data-language': language }
                    : {},
                }).range(line.from),
              );
            }
          }
          else {
            // When cursor inside, show subtle editing background with proper padding
            const totalLines = endLine.number - startLine.number + 1;

            for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
              const line = view.state.doc.line(lineNum);
              let editClass = 'cm-md-codeblock-editing';

              if (totalLines === 1) {
                editClass += ' cm-md-codeblock-editing-single';
              }
              else if (lineNum === startLine.number) {
                editClass += ' cm-md-codeblock-editing-first';
              }
              else if (lineNum === endLine.number) {
                editClass += ' cm-md-codeblock-editing-last';
              }

              decorations.push(
                Decoration.line({ class: editClass }).range(line.from),
              );
            }
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
  '.cm-md-hidden': {
    fontSize: '0',
    width: '0',
    display: 'inline-block',
    overflow: 'hidden',
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
    marginRight: '0.5em',
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
    overflow: 'hidden',
  },
  '.cm-md-hr::after': {
    content: '""',
    display: 'inline-block',
    width: '100%',
    height: '1px',
    backgroundColor: 'var(--border)',
    verticalAlign: 'middle',
  },
  '.cm-md-codeblock-fence-hidden': {
    display: 'none !important',
    height: '0 !important',
    margin: '0 !important',
    padding: '0 !important',
    lineHeight: '0 !important',
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
  '.cm-md-codeblock-editing': {
    backgroundColor: 'color-mix(in oklch, var(--muted) 50%, transparent)',
    paddingLeft: '1.25rem !important',
    paddingRight: '1.25rem !important',
  },
  '.cm-md-codeblock-editing-first': {
    paddingTop: '0.75rem !important',
    borderTopLeftRadius: '0.5rem',
    borderTopRightRadius: '0.5rem',
    marginTop: '0.5rem',
  },
  '.cm-md-codeblock-editing-last': {
    paddingBottom: '0.75rem !important',
    borderBottomLeftRadius: '0.5rem',
    borderBottomRightRadius: '0.5rem',
    marginBottom: '0.5rem',
  },
  '.cm-md-codeblock-editing-single': {
    paddingTop: '0.75rem !important',
    paddingBottom: '0.75rem !important',
    borderRadius: '0.5rem',
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
  },
  '.cm-md-list-marker': {
    color: 'var(--muted-foreground)',
  },
  '.cm-md-task-marker': {
    color: 'var(--muted-foreground)',
  },
});
