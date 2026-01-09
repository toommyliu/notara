import type { Range } from '@codemirror/state';
import type {
  DecorationSet,
  ViewUpdate,
} from '@codemirror/view';
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language';
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

const ALERT_TYPES: Record<string, { class: string; icon: string; label: string }> = {
  NOTE: {
    class: 'cm-md-alert-note',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    label: 'Note',
  },
  TIP: {
    class: 'cm-md-alert-tip',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
    label: 'Tip',
  },
  IMPORTANT: {
    class: 'cm-md-alert-important',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    label: 'Important',
  },
  WARNING: {
    class: 'cm-md-alert-warning',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    label: 'Warning',
  },
  CAUTION: {
    class: 'cm-md-alert-caution',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
    label: 'Caution',
  },
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

class AlertLabelWidget extends WidgetType {
  constructor(
    readonly alertType: string,
    readonly config: { class: string; icon: string; label: string },
  ) {
    super();
  }

  toDOM() {
    const wrapper = document.createElement('span');
    wrapper.className = `cm-md-alert-label ${this.config.class}-label`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'cm-md-alert-icon';
    iconSpan.innerHTML = this.config.icon;

    const textSpan = document.createElement('span');
    textSpan.className = 'cm-md-alert-text';
    textSpan.textContent = this.config.label;

    wrapper.appendChild(iconSpan);
    wrapper.appendChild(textSpan);
    return wrapper;
  }

  eq(other: AlertLabelWidget) {
    return this.alertType === other.alertType;
  }
}

class ExternalLinkIconWidget extends WidgetType {
  constructor(readonly url: string) {
    super();
  }

  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-md-link-icon';
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', 'External link');

    span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`;

    span.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      this.openExternalUrl();
    });

    return span;
  }

  private openExternalUrl() {
    openExternalUrl(this.url);
  }

  eq(other: ExternalLinkIconWidget) {
    return this.url === other.url;
  }
}

function openExternalUrl(url: string) {
  import('@tauri-apps/plugin-opener').then(({ openUrl }) => {
    openUrl(url);
  }).catch(() => {
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

function isExternalUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

function isFenceLineText(text: string): boolean {
  const t = text.trim();
  return t.startsWith('```') || t.startsWith('~~~');
}

function getDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const cursorPos = view.state.selection.main.head;
  const cursorLine = view.state.doc.lineAt(cursorPos).number;

  // Ensure the syntax tree is fully parsed for the entire document.
  // This prevents styles from not applying to unparsed content on initial load.
  ensureSyntaxTree(view.state, view.state.doc.length, 500);
  const tree = syntaxTree(view.state);

  // Decorate the whole document to avoid missing styles and layout gaps on long notes.
  tree.iterate({
    from: 0,
    to: view.state.doc.length,
    enter: (node) => {
      if (node.name === 'ListMark') {
        decorations.push(
          Decoration.mark({ class: 'cm-md-list-marker' }).range(node.from, node.to),
        );
      }

      if (node.name === 'TaskMarker') {
        const nodeLine = view.state.doc.lineAt(node.from).number;
        const cursorOnLine = cursorLine === nodeLine;
        const text = view.state.sliceDoc(node.from, node.to);
        const isChecked = text.includes('x') || text.includes('X');
        const line = view.state.doc.lineAt(node.from);

        if (!cursorOnLine) {
          decorations.push(
            Decoration.replace({
              widget: new CheckboxWidget(isChecked, node.from),
              inclusiveStart: false,
              inclusiveEnd: false,
            }).range(node.from, node.to),
          );
        }
        else {
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

      const inlineFormat = INLINE_FORMATS[node.name];
      if (inlineFormat) {
        const nodeFrom = node.from;
        const nodeTo = node.to;
        const contentFrom = nodeFrom + inlineFormat.markerLen;
        const contentTo = nodeTo - inlineFormat.markerLen;

        if (contentTo > contentFrom) {
          decorations.push(
            Decoration.mark({ class: inlineFormat.class }).range(contentFrom, contentTo),
          );
        }

        decorations.push(
          Decoration.mark({ class: 'cm-md-syntax' }).range(nodeFrom, contentFrom),
        );
        decorations.push(
          Decoration.mark({ class: 'cm-md-syntax' }).range(contentTo, nodeTo),
        );

        return;
      }

      const headingClass = HEADING_CLASSES[node.name];
      if (headingClass) {
        decorations.push(
          Decoration.mark({ class: headingClass }).range(node.from, node.to),
        );

        const child = node.node.firstChild;
        if (child?.name === 'HeaderMark') {
          decorations.push(
            Decoration.mark({ class: 'cm-md-syntax' }).range(child.from, child.to),
          );
        }

        return false;
      }

      if (node.name === 'Blockquote') {
        const startLine = view.state.doc.lineAt(node.from);
        const endLine = view.state.doc.lineAt(node.to);
        const firstLineText = startLine.text;

        const alertMatch = firstLineText.match(/^\s*>\s*\[!([A-Z]+)\]/);
        const alertType = alertMatch ? alertMatch[1] : null;
        const alertConfig = alertType ? ALERT_TYPES[alertType] : null;

        const cursorInsideBlock = cursorLine >= startLine.number && cursorLine <= endLine.number;
        if (alertConfig) {

          for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
            const line = view.state.doc.line(lineNum);
            const isFirstLine = lineNum === startLine.number;
            const isLastLine = lineNum === endLine.number;
            const totalLines = endLine.number - startLine.number + 1;

            let lineClass = `cm-md-alert-line ${alertConfig.class}`;

            if (totalLines === 1) {
              lineClass += ' cm-md-alert-single';
            }
            else if (isFirstLine) {
              lineClass += ' cm-md-alert-first';
            }
            else if (isLastLine) {
              lineClass += ' cm-md-alert-last';
            }
            else {
              lineClass += ' cm-md-alert-middle';
            }

            decorations.push(
              Decoration.line({ class: lineClass }).range(line.from),
            );
          }

          const markerMatch = firstLineText.match(/^(\s*>\s*)(\[!([A-Z]+)\])/);
          if (markerMatch) {
            const markerStart = startLine.from;
            const markerEnd = startLine.from + markerMatch[1].length + markerMatch[2].length;

            if (cursorInsideBlock && cursorLine === startLine.number) {
              decorations.push(
                Decoration.mark({ class: 'cm-md-syntax' }).range(markerStart, markerEnd),
              );
            }
            else {
              decorations.push(
                Decoration.replace({
                  widget: new AlertLabelWidget(alertType!, alertConfig),
                  inclusiveStart: false,
                  inclusiveEnd: false,
                }).range(markerStart, markerEnd),
              );
            }
          }

          node.node.cursor().iterate((child) => {
            if (child.name === 'QuoteMark') {
              const lineNum = view.state.doc.lineAt(child.from).number;
              if (cursorInsideBlock && cursorLine === lineNum) {
                decorations.push(
                  Decoration.mark({ class: 'cm-md-syntax' }).range(child.from, child.to),
                );
              }
              else {
                decorations.push(
                  Decoration.replace({}).range(child.from, child.to),
                );
              }
            }
          });
        }
        else {
          decorations.push(
            Decoration.mark({ class: 'cm-md-blockquote' }).range(node.from, node.to),
          );

          node.node.cursor().iterate((child) => {
            if (child.name === 'QuoteMark') {
              const lineNum = view.state.doc.lineAt(child.from).number;
              if (cursorInsideBlock && cursorLine === lineNum) {
                decorations.push(
                  Decoration.mark({ class: 'cm-md-syntax' }).range(child.from, child.to),
                );
              }
              else {
                decorations.push(
                  Decoration.replace({}).range(child.from, child.to),
                );
              }
            }
          });
        }
      }

      if (node.name === 'Link') {
        const nodeLine = view.state.doc.lineAt(node.from).number;
        const cursorOnLine = cursorLine === nodeLine;

        let linkTextFrom = -1;
        let linkTextTo = -1;
        let urlFrom = -1;
        let urlTo = -1;

        const linkMarks: { from: number; to: number; text: string }[] = [];

        node.node.cursor().iterate((child) => {
          if (child.name === 'LinkMark') {
            linkMarks.push({
              from: child.from,
              to: child.to,
              text: view.state.sliceDoc(child.from, child.to),
            });
          }

          if (child.name === 'URL') {
            urlFrom = child.from;
            urlTo = child.to;
          }
        });

        const openBracket = linkMarks.find(m => m.text === '[');
        const closeBracket = linkMarks.find(m => m.text === ']');

        if (openBracket && closeBracket) {
          linkTextFrom = openBracket.to;
          linkTextTo = closeBracket.from;
        }

        if (linkTextFrom >= 0 && linkTextTo > linkTextFrom) {
          const url = urlFrom >= 0 ? view.state.sliceDoc(urlFrom, urlTo) : '';
          const isExternal = isExternalUrl(url);

          if (cursorOnLine) {
            decorations.push(
              Decoration.mark({ class: 'cm-md-link' }).range(linkTextFrom, linkTextTo),
            );

            decorations.push(
              Decoration.mark({ class: 'cm-md-syntax' }).range(node.from, linkTextFrom),
            );

            decorations.push(
              Decoration.mark({ class: 'cm-md-syntax' }).range(linkTextTo, node.to),
            );

            if (isExternal) {
              decorations.push(
                Decoration.widget({
                  widget: new ExternalLinkIconWidget(url),
                  side: 1,
                }).range(node.to),
              );
            }
          }
          else {
            decorations.push(
              Decoration.mark({
                class: isExternal ? 'cm-md-link cm-md-link-external' : 'cm-md-link',
                attributes: { 'data-href': url },
              }).range(linkTextFrom, linkTextTo),
            );

            decorations.push(
              Decoration.replace({
                inclusiveStart: false,
                inclusiveEnd: false,
              }).range(node.from, linkTextFrom),
            );

            if (isExternal) {
              decorations.push(
                Decoration.replace({
                  widget: new ExternalLinkIconWidget(url),
                  inclusiveStart: false,
                  inclusiveEnd: false,
                }).range(linkTextTo, node.to),
              );
            }
            else {
              decorations.push(
                Decoration.replace({
                  inclusiveStart: false,
                  inclusiveEnd: false,
                }).range(linkTextTo, node.to),
              );
            }
          }
        }
      }

      if (node.name === 'Image') {
        const nodeLine = view.state.doc.lineAt(node.from).number;
        const cursorOnLine = cursorLine === nodeLine;

        let altTextFrom = -1;
        let altTextTo = -1;

        const imageMarks: { from: number; to: number; text: string }[] = [];

        node.node.cursor().iterate((child) => {
          if (child.name === 'LinkMark') {
            imageMarks.push({
              from: child.from,
              to: child.to,
              text: view.state.sliceDoc(child.from, child.to),
            });
          }
        });

        const openBracket = imageMarks.find(m => m.text === '[');
        const closeBracket = imageMarks.find(m => m.text === ']');

        if (openBracket && closeBracket) {
          altTextFrom = openBracket.to;
          altTextTo = closeBracket.from;
        }

        if (altTextFrom >= 0 && altTextTo >= altTextFrom) {
          if (cursorOnLine) {
            if (altTextTo > altTextFrom) {
              decorations.push(
                Decoration.mark({ class: 'cm-md-image-alt' }).range(altTextFrom, altTextTo),
              );
            }

            decorations.push(
              Decoration.mark({ class: 'cm-md-syntax' }).range(node.from, altTextFrom),
            );

            decorations.push(
              Decoration.mark({ class: 'cm-md-syntax' }).range(altTextTo, node.to),
            );
          }
          else {
            if (altTextTo > altTextFrom) {
              decorations.push(
                Decoration.mark({ class: 'cm-md-image-placeholder' }).range(altTextFrom, altTextTo),
              );
            }

            decorations.push(
              Decoration.replace({
                inclusiveStart: false,
                inclusiveEnd: false,
              }).range(node.from, altTextFrom),
            );

            decorations.push(
              Decoration.replace({
                inclusiveStart: false,
                inclusiveEnd: false,
              }).range(altTextTo, node.to),
            );
          }
        }
      }

      if (node.name === 'HorizontalRule') {
        decorations.push(
          Decoration.mark({ class: 'cm-md-hr' }).range(node.from, node.to),
        );
      }

      if (node.name === 'FencedCode') {
        const startLine = view.state.doc.lineAt(node.from);
        const endLine = view.state.doc.lineAt(node.to);

        const cursorInsideCodeblock = cursorLine >= startLine.number && cursorLine <= endLine.number;

        let language = '';

        node.node.cursor().iterate((child) => {
          if (child.name === 'CodeInfo') {
            language = view.state.doc.sliceString(child.from, child.to).trim();
          }
        });

        for (let lineNum = startLine.number; lineNum <= endLine.number; lineNum++) {
          const line = view.state.doc.line(lineNum);
          const totalLines = endLine.number - startLine.number + 1;
          const isFirstLine = lineNum === startLine.number;
          const isLastLine = lineNum === endLine.number;
          const isFenceLine = isFirstLine || isLastLine;

          const isNested = node.node.parent?.name === 'Blockquote';
          let lineClass = isNested ? 'cm-md-codeblock-line cm-md-codeblock-line-nested' : 'cm-md-codeblock-line';

          if (cursorInsideCodeblock) {
            if (totalLines === 1) {
              lineClass += ' cm-md-codeblock-single';
            }
            else if (isFirstLine) {
              lineClass += ' cm-md-codeblock-first';
            }
            else if (isLastLine) {
              lineClass += ' cm-md-codeblock-last';
            }
            else {
              lineClass += ' cm-md-codeblock-middle';
            }

            decorations.push(
              Decoration.line({
                class: lineClass,
                attributes: (isFirstLine && language) ? { 'data-language': language } : {},
              }).range(line.from),
            );
          }
          else {
            if (isFenceLine) {
              decorations.push(
                Decoration.line({
                  class: 'cm-md-codeblock-fence-hidden',
                }).range(line.from),
              );
            }
            else {
              const contentLines = totalLines - 2;
              const contentLineNum = lineNum - startLine.number - 1;

              if (contentLines === 1) {
                lineClass += ' cm-md-codeblock-single';
              }
              else if (contentLineNum === 0) {
                lineClass += ' cm-md-codeblock-first';
              }
              else if (contentLineNum === contentLines - 1) {
                lineClass += ' cm-md-codeblock-last';
              }
              else {
                lineClass += ' cm-md-codeblock-middle';
              }

              decorations.push(
                Decoration.line({
                  class: lineClass,
                  attributes: (contentLineNum === 0 && language) ? { 'data-language': language } : {},
                }).range(line.from),
              );
            }
          }
        }

        if (cursorInsideCodeblock) {
          decorations.push(
            Decoration.mark({ class: 'cm-md-syntax' }).range(startLine.from, startLine.to),
          );

          if (endLine.number !== startLine.number) {
            decorations.push(
              Decoration.mark({ class: 'cm-md-syntax' }).range(endLine.from, endLine.to),
            );
          }
        }

        return false;
      }
    },
  });

  decorations.sort((a, b) => a.from - b.from || a.value.startSide - b.value.startSide);

  const builder = new RangeSetBuilder<Decoration>();
  for (const deco of decorations)
    builder.add(deco.from, deco.to, deco.value);

  return builder.finish();
}

export const livePreview = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    parsedUpTo: number;

    constructor(view: EditorView) {
      this.decorations = getDecorations(view);
      this.parsedUpTo = syntaxTree(view.state).length;
    }

    update(update: ViewUpdate) {
      const tree = syntaxTree(update.state);
      const currentParsedUpTo = tree.length;
      const parsingProgressed = currentParsedUpTo > this.parsedUpTo;

      if (update.docChanged || update.selectionSet || parsingProgressed) {
        this.decorations = getDecorations(update.view);
        this.parsedUpTo = currentParsedUpTo;
      }
    }
  },
  {
    decorations: v => v.decorations,
  },
);

export const livePreviewClickHandler = EditorView.domEventHandlers({
  mousedown(ev, view) {
    const pos = view.posAtCoords({ x: ev.clientX, y: ev.clientY });
    if (pos === null)
      return false;

    const line = view.state.doc.lineAt(pos);
    const lineText = line.text.trim();

    const isFenceLine = isFenceLineText(lineText);
    if (!isFenceLine)
      return false;

    const cursorLine = view.state.doc.lineAt(view.state.selection.main.head).number;
    const cursorInsideCodeblock = (() => {
      let inside = false;
      const tree = syntaxTree(view.state);
      tree.iterate({
        enter: (node) => {
          if (node.name === 'FencedCode') {
            const startLine = view.state.doc.lineAt(node.from).number;
            const endLine = view.state.doc.lineAt(node.to).number;
            if (cursorLine > startLine && cursorLine < endLine) {
              inside = true;
              return false;
            }
          }
        },
      });
      return inside;
    })();

    if (cursorInsideCodeblock)
      return false;

    ev.preventDefault();
    ev.stopPropagation();

    let targetPos = line.from;
    const tree = syntaxTree(view.state);
    tree.iterate({
      enter: (node) => {
        if (node.name === 'FencedCode') {
          const startLine = view.state.doc.lineAt(node.from);
          const endLine = view.state.doc.lineAt(node.to);

          if (line.number === startLine.number) {
            const nextLine = view.state.doc.line(startLine.number + 1);
            targetPos = nextLine.from;
            return false;
          }

          if (line.number === endLine.number) {
            const prevLine = view.state.doc.line(endLine.number - 1);
            targetPos = prevLine.to;
            return false;
          }
        }
      },
    });

    view.dispatch({
      selection: { anchor: targetPos },
      scrollIntoView: true,
    });

    view.focus();
    return true;
  },

  click(ev, _view) {
    const target = ev.target as HTMLElement;
    const linkElement = target.closest('[data-href]');

    if (linkElement) {
      const href = linkElement.getAttribute('data-href');
      if (href && isExternalUrl(href)) {
        ev.preventDefault();
        openExternalUrl(href);
        return true;
      }
    }

    return false;
  },
});

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
  '.cm-md-alert-line': {
    paddingLeft: '1rem !important',
    paddingRight: '1rem !important',
    position: 'relative',
    color: 'var(--foreground)',
    borderLeft: '4px solid transparent',
  },
  '.cm-md-alert-first': {
    paddingTop: '1rem !important',
    borderTopLeftRadius: '0.375rem',
    borderTopRightRadius: '0.375rem',
  },
  '.cm-md-alert-last': {
    paddingBottom: '1rem !important',
    borderBottomLeftRadius: '0.375rem',
    borderBottomRightRadius: '0.375rem',
  },
  '.cm-md-alert-single': {
    paddingTop: '1rem !important',
    paddingBottom: '1rem !important',
    borderRadius: '0.375rem',
  },
  '.cm-md-alert-middle': {},
  '.cm-md-alert-label': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: '500',
    fontSize: '1em',
  },
  '.cm-md-alert-icon': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '.cm-md-alert-icon svg': {
    display: 'block',
    width: '16px',
    height: '16px',
  },
  '.cm-md-alert-text': {},
  '.cm-md-alert-note': {
    backgroundColor: 'color-mix(in srgb, #0969da 8%, transparent)',
    borderLeftColor: '#0969da',
  },
  '.cm-md-alert-note-label': {
    color: '#0969da',
  },
  '.dark .cm-md-alert-note': {
    backgroundColor: 'color-mix(in srgb, #4493f8 15%, transparent)',
    borderLeftColor: '#4493f8',
  },
  '.dark .cm-md-alert-note-label': {
    color: '#4493f8',
  },
  '.cm-md-alert-tip': {
    backgroundColor: 'color-mix(in srgb, #1a7f37 8%, transparent)',
    borderLeftColor: '#1a7f37',
  },
  '.cm-md-alert-tip-label': {
    color: '#1a7f37',
  },
  '.dark .cm-md-alert-tip': {
    backgroundColor: 'color-mix(in srgb, #3fb950 15%, transparent)',
    borderLeftColor: '#3fb950',
  },
  '.dark .cm-md-alert-tip-label': {
    color: '#3fb950',
  },
  '.cm-md-alert-important': {
    backgroundColor: 'color-mix(in srgb, #8250df 8%, transparent)',
    borderLeftColor: '#8250df',
  },
  '.cm-md-alert-important-label': {
    color: '#8250df',
  },
  '.dark .cm-md-alert-important': {
    backgroundColor: 'color-mix(in srgb, #a371f7 15%, transparent)',
    borderLeftColor: '#a371f7',
  },
  '.dark .cm-md-alert-important-label': {
    color: '#a371f7',
  },
  '.cm-md-alert-warning': {
    backgroundColor: 'color-mix(in srgb, #9a6700 8%, transparent)',
    borderLeftColor: '#9a6700',
  },
  '.cm-md-alert-warning-label': {
    color: '#9a6700',
  },
  '.dark .cm-md-alert-warning': {
    backgroundColor: 'color-mix(in srgb, #d29922 15%, transparent)',
    borderLeftColor: '#d29922',
  },
  '.dark .cm-md-alert-warning-label': {
    color: '#d29922',
  },
  '.cm-md-alert-caution': {
    backgroundColor: 'color-mix(in srgb, #d1242f 8%, transparent)',
    borderLeftColor: '#d1242f',
  },
  '.cm-md-alert-caution-label': {
    color: '#d1242f',
  },
  '.dark .cm-md-alert-caution': {
    backgroundColor: 'color-mix(in srgb, #f85149 15%, transparent)',
    borderLeftColor: '#f85149',
  },
  '.dark .cm-md-alert-caution-label': {
    color: '#f85149',
  },
  '.cm-md-link': {
    color: 'var(--brand)',
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    cursor: 'pointer',
  },
  '.cm-md-link-external': {
    textDecoration: 'underline',
  },
  '.cm-md-link-icon': {
    color: 'var(--brand)',
    marginLeft: '2px',
    textDecoration: 'none',
    display: 'inline',
    verticalAlign: 'text-bottom',
    cursor: 'pointer',
    position: 'relative',
    top: '2px',
  },
  '.cm-md-link-icon svg': {
    display: 'inline',
    verticalAlign: 'text-bottom',
  },
  '.cm-md-image-alt': {
    color: 'var(--muted-foreground)',
  },
  '.cm-md-image-placeholder': {
    color: 'var(--muted-foreground)',
    fontStyle: 'italic',
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
    paddingTop: '1.75rem !important',
    borderTopLeftRadius: '0.625rem',
    borderTopRightRadius: '0.625rem',
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
    paddingBottom: '1.75rem !important',
    borderBottomLeftRadius: '0.625rem',
    borderBottomRightRadius: '0.625rem',
  },
  '.cm-md-codeblock-middle': {
  },
  '.cm-md-codeblock-fence-hidden': {
    visibility: 'hidden',
    height: '0',
    lineHeight: '0',
    overflow: 'hidden',
    pointerEvents: 'none',
    padding: '0 !important',
    margin: '0',
  },
  '.cm-md-codeblock-single': {
    paddingTop: '1.75rem !important',
    paddingBottom: '1.75rem !important',
    borderRadius: '0.625rem',
  },
  '.cm-md-codeblock-line-nested': {
    backgroundColor: 'transparent !important',
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
