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

function getDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const cursorPos = view.state.selection.main.head;
  const cursorLine = view.state.doc.lineAt(cursorPos).number;

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
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
});
