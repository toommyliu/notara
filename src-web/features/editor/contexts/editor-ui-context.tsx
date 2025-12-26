'use client';

import * as React from 'react';

type EditorUIContextValue = {
  showFixedToolbar: boolean;
  setShowFixedToolbar: (show: boolean) => void;
  // Page metadata
  pageIcon: string;
  setPageIcon: (icon: string) => void;
  coverUrl: string | null;
  setCoverUrl: (url: string | null) => void;
};

const EditorUIContext = React.createContext<EditorUIContextValue | null>(null);

export function EditorUIProvider({ children }: { children: React.ReactNode }) {
  const [showFixedToolbar, setShowFixedToolbar] = React.useState(true);
  const [pageIcon, setPageIcon] = React.useState('');
  const [coverUrl, setCoverUrl] = React.useState<string | null>(null);

  const value = React.useMemo(
    () => ({
      showFixedToolbar,
      setShowFixedToolbar,
      pageIcon,
      setPageIcon,
      coverUrl,
      setCoverUrl
    }),
    [showFixedToolbar, pageIcon, coverUrl]
  );

  return <EditorUIContext.Provider value={value}>{children}</EditorUIContext.Provider>;
}

export function useEditorUi() {
  const context = React.useContext(EditorUIContext);

  if (!context) {
    return {
      showFixedToolbar: true,
      setShowFixedToolbar: () => {},
      pageIcon: '',
      setPageIcon: () => {},
      coverUrl: null,
      setCoverUrl: () => {}
    };
  }

  return context;
}
