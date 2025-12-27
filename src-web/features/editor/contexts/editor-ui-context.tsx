'use client';

import * as React from 'react';

interface EditorUIContextValue {
  // Page metadata
  pageIcon: string;
  setPageIcon: (icon: string) => void;
  coverUrl: string | null;
  setCoverUrl: (url: string | null) => void;
}

const EditorUIContext = React.createContext<EditorUIContextValue | null>(null);

export function EditorUIProvider({ children }: { children: React.ReactNode }) {
  const [pageIcon, setPageIcon] = React.useState('');
  const [coverUrl, setCoverUrl] = React.useState<string | null>(null);

  const value = React.useMemo(
    () => ({
      pageIcon,
      setPageIcon,
      coverUrl,
      setCoverUrl,
    }),
    [pageIcon, coverUrl],
  );

  return <EditorUIContext value={value}>{children}</EditorUIContext>;
}

export function useEditorUi() {
  const context = React.use(EditorUIContext);

  if (!context) {
    return {
      pageIcon: '',
      setPageIcon: () => {},
      coverUrl: null,
      setCoverUrl: () => {},
    };
  }

  return context;
}
