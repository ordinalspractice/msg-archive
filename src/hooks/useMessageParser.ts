import { useRef, useCallback, useEffect } from 'react';
import { logger } from '../utils/logger';
import type { ParsedThread, WorkerMessage } from '../types/messenger';

interface UseMessageParserOptions {
  onThreadParsed?: (thread: ParsedThread) => void;
  onProgress?: (threadId: string, progress: number, data?: any) => void;
  onError?: (threadId: string, error: string) => void;
}

export function useMessageParser(options: UseMessageParserOptions = {}) {
  const workerRef = useRef<Worker | null>(null);
  const { onThreadParsed, onProgress, onError } = options;

  useEffect(() => {
    // Create worker on mount
    workerRef.current = new Worker(new URL('../workers/parser.worker.ts', import.meta.url), {
      type: 'module',
    });

    // Set up message handler
    workerRef.current.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;

      switch (message.type) {
        case 'THREAD_PARSED':
          logger.debug('THREAD_PARSED_RECEIVED', { threadId: message.threadId });
          if (onThreadParsed && message.data) {
            onThreadParsed(message.data);
          }
          break;

        case 'PROGRESS':
          if (onProgress && message.threadId && message.progress !== undefined) {
            onProgress(message.threadId, message.progress, message.data);
          }
          break;

        case 'WORKER_ERROR':
          logger.error('WORKER_ERROR_RECEIVED', {
            threadId: message.threadId,
            error: message.error,
          });
          if (onError && message.threadId && message.error) {
            onError(message.threadId, message.error);
          }
          break;
      }
    });

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [onThreadParsed, onProgress, onError]);

  const parseThread = useCallback(
    (directoryHandle: FileSystemDirectoryHandle, threadPath: string) => {
      if (!workerRef.current) {
        logger.error('WORKER_NOT_INITIALIZED', 'Worker is not initialized');
        return;
      }

      logger.debug('PARSE_THREAD_REQUEST', { threadPath });
      workerRef.current.postMessage({
        type: 'PARSE_THREAD',
        directoryHandle,
        threadPath,
      });
    },
    [],
  );

  return { parseThread };
}
