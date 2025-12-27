'use client';

import * as React from 'react';

interface EditorUIContextValue {
  // Note data
  noteId: string | null;
  noteTitle: string;
  noteEmoji: string;
  // Page metadata
  pageIcon: string;
  setPageIcon: (icon: string) => void;
  coverUrl: string | null;
  setCoverUrl: (url: string | null) => void;
}

interface EditorUIProviderProps {
  noteId?: string | null;
  noteTitle?: string;
  noteEmoji?: string;
  children: React.ReactNode;
}

const EditorUIContext = React.createContext<EditorUIContextValue | null>(null);

export function EditorUIProvider({
  noteId = null,
  noteTitle = 'Untitled',
  noteEmoji = '',
  children,
}: EditorUIProviderProps) {
  const [pageIcon, setPageIcon] = React.useState('');
  const [coverUrl, setCoverUrl] = React.useState<string | null>(null);

  const value = React.useMemo(
    () => ({
      noteId,
      noteTitle,
      noteEmoji,
      pageIcon,
      setPageIcon,
      coverUrl,
      setCoverUrl,
    }),
    [noteId, noteTitle, noteEmoji, pageIcon, coverUrl],
  );

  return <EditorUIContext value={value}>{children}</EditorUIContext>;
}

export function useEditorUi() {
  const context = React.use(EditorUIContext);

  if (!context) {
    return {
      noteId: null,
      noteTitle: 'Untitled',
      noteEmoji: '',
      pageIcon: '',
      setPageIcon: () => {},
      coverUrl: null,
      setCoverUrl: () => {},
    };
  }

  return context;
}
