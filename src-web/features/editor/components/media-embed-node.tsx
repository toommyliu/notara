'use client';

import type { TMediaEmbedElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useMediaState } from '@platejs/media/react';
import { ExternalLinkIcon, GlobeIcon, Link2Icon } from 'lucide-react';
import { PlateElement, useEditorRef } from 'platejs/react';
import * as React from 'react';

import { cn } from '~/lib/utils';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  }
  catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  }
  catch {
    return '';
  }
}

export function MediaEmbedElement(props: PlateElementProps<TMediaEmbedElement>) {
  const { focused, readOnly, selected } = useMediaState({});
  const { element } = props;
  const editor = useEditorRef();
  const url = (element.url as string) || '';

  const [inputValue, setInputValue] = React.useState(url);
  const [isEditing, setIsEditing] = React.useState(!url);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const domain = extractDomain(url);
  const faviconUrl = getFaviconUrl(url);
  const [faviconError, setFaviconError] = React.useState(false);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim()) {
      const path = editor.api.findPath(element);
      if (path) {
        editor.tf.setNodes({ url: inputValue.trim() }, { at: path });
      }
      setIsEditing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (readOnly) {
      e.preventDefault();
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    else if (!isEditing && selected) {
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      if (!url) {
        const path = editor.api.findPath(element);
        if (path) {
          editor.tf.removeNodes({ at: path });
        }
      }
    }
  };

  if (isEditing || !url) {
    return (
      <PlateElement className="py-2" {...props}>
        <div contentEditable={false}>
          <form onSubmit={handleSubmit}>
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3',
                focused && selected && 'ring-2 ring-ring ring-offset-2',
              )}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <Link2Icon className="size-5 text-muted-foreground" />
              </div>

              <input
                ref={inputRef}
                type="url"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (inputValue.trim()) {
                    handleSubmit();
                  }
                }}
                placeholder="Paste a link..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />

              <button
                type="submit"
                className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Embed
              </button>
            </div>
          </form>
        </div>

        {props.children}
      </PlateElement>
    );
  }

  return (
    <PlateElement className="py-2" {...props}>
      <div contentEditable={false}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          title={url}
          className={cn(
            'group/link flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 transition-all duration-200',
            'hover:border-border/80 hover:bg-muted/50',
            !readOnly && 'cursor-default',
            !readOnly && focused && selected && 'ring-2 ring-ring ring-offset-2',
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
            {faviconUrl && !faviconError
              ? (
                <img
                  src={faviconUrl}
                  alt=""
                  className="size-5 object-contain"
                  onError={() => setFaviconError(true)}
                />
              )
              : (
                <GlobeIcon className="size-5 text-muted-foreground" />
              )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">
              {url}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {domain}
            </div>
          </div>

          <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/link:opacity-100" />
        </a>
      </div>

      {props.children}
    </PlateElement>
  );
}
