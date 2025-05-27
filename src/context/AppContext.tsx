import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ParsedThread, ThreadMetadata } from '../types/messenger';

interface AppContextType {
  directoryHandle: FileSystemDirectoryHandle | null;
  setDirectoryHandle: (handle: FileSystemDirectoryHandle | null) => void;
  threads: Map<string, ParsedThread>;
  threadMetadata: ThreadMetadata[];
  addThread: (thread: ParsedThread) => void;
  getThread: (threadId: string) => ParsedThread | undefined;
  isThreadLoading: (threadId: string) => boolean;
  setThreadLoading: (threadId: string, loading: boolean) => void;
  threadLoadingStates: Map<string, boolean>;
  parseProgress: Map<string, number>;
  setParseProgress: (threadId: string, progress: number) => void;
  loadInitialThreads: (initialThreads: ThreadMetadata[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [threads, setThreads] = useState<Map<string, ParsedThread>>(new Map());
  const [threadMetadata, setThreadMetadataState] = useState<ThreadMetadata[]>([]);
  const [threadLoadingStates, setThreadLoadingStates] = useState<Map<string, boolean>>(new Map());
  const [parseProgress, setParseProgressState] = useState<Map<string, number>>(new Map());

  const loadInitialThreads = useCallback((initialThreads: ThreadMetadata[]) => {
    // Sort initial threads by title (folder name) alphabetically
    const sortedInitialThreads = [...initialThreads].sort((a, b) =>
      (a.title || '').localeCompare(b.title || ''),
    );
    setThreadMetadataState(sortedInitialThreads);
  }, []);

  const addThread = useCallback((thread: ParsedThread) => {
    setThreads((prev) => {
      const newThreads = new Map(prev);
      newThreads.set(thread.threadId, thread);
      return newThreads;
    });

    // Update metadata
    const metadata: ThreadMetadata = {
      id: thread.threadId,
      participants: thread.participants,
      lastMessageTime: thread.messages[thread.messages.length - 1]?.timestamp_ms || 0,
      totalMessages: thread.messages.length,
      title: thread.title,
    };

    setThreadMetadataState((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === metadata.id);
      let newMetaArray;
      if (existingIndex >= 0) {
        newMetaArray = [...prev];
        newMetaArray[existingIndex] = metadata;
      } else {
        // This case handles if the thread wasn't in the initial list for some reason
        newMetaArray = [...prev, metadata];
      }
      // Sort by last message time, most recent first
      return newMetaArray.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
    });

    // Clear loading state
    setThreadLoadingStates((prev) => {
      const newStates = new Map(prev);
      newStates.delete(thread.threadId);
      return newStates;
    });
  }, []);

  const getThread = useCallback(
    (threadId: string) => {
      return threads.get(threadId);
    },
    [threads],
  );

  const isThreadLoading = useCallback(
    (threadId: string) => {
      return threadLoadingStates.get(threadId) || false;
    },
    [threadLoadingStates],
  );

  const setThreadLoading = useCallback((threadId: string, loading: boolean) => {
    setThreadLoadingStates((prev) => {
      const newStates = new Map(prev);
      if (loading) {
        newStates.set(threadId, true);
      } else {
        newStates.delete(threadId);
      }
      return newStates;
    });
  }, []);

  const setParseProgress = useCallback((threadId: string, progress: number) => {
    setParseProgressState((prev) => {
      const newProgress = new Map(prev);
      if (progress >= 100) {
        newProgress.delete(threadId);
      } else {
        newProgress.set(threadId, progress);
      }
      return newProgress;
    });
  }, []);

  const value: AppContextType = {
    directoryHandle,
    setDirectoryHandle,
    threads,
    threadMetadata,
    addThread,
    getThread,
    isThreadLoading,
    setThreadLoading,
    threadLoadingStates,
    parseProgress,
    setParseProgress,
    loadInitialThreads,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
