import { ThreadSchema, type ParsedThread, type WorkerMessage } from '../types/messenger';

interface ParseRequest {
  type: 'PARSE_THREAD';
  directoryHandle: FileSystemDirectoryHandle;
  threadPath: string;
}

const logDebug = (event: string, data?: any) => {
  console.debug(`[Worker] ${event}`, data || '');
};

const postMessage = (message: WorkerMessage) => {
  self.postMessage(message);
};

async function parseThreadFile(
  fileHandle: FileSystemFileHandle,
  threadId: string,
): Promise<ParsedThread | null> {
  try {
    const file = await fileHandle.getFile();
    const text = await file.text();

    // Parse the JSON
    const data = JSON.parse(text);

    // Validate with zod
    const validatedData = ThreadSchema.parse(data);

    return {
      threadId,
      participants: validatedData.participants,
      messages: validatedData.messages.sort((a, b) => a.timestamp_ms - b.timestamp_ms),
      title: validatedData.title,
    };
  } catch (error) {
    logDebug('PARSE_ERROR', { threadId, error });
    return null;
  }
}

async function parseThreadDirectory(dirHandle: FileSystemDirectoryHandle, threadPath: string) {
  try {
    logDebug('WORKER_STARTED', { threadPath });
    postMessage({ type: 'PROGRESS', progress: 0, threadId: threadPath });

    const messages: any[] = [];
    let participants: any[] = [];
    let title: string | undefined;
    let fileCount = 0;
    const messageFiles: FileSystemFileHandle[] = [];

    // Collect all message files
    for await (const entry of dirHandle.values()) {
      if (
        entry.kind === 'file' &&
        entry.name.startsWith('message_') &&
        entry.name.endsWith('.json')
      ) {
        messageFiles.push(entry);
      }
    }

    const totalFiles = messageFiles.length;
    logDebug('FILES_FOUND', { threadPath, totalFiles });

    // Parse each message file
    for (const fileHandle of messageFiles) {
      const parsed = await parseThreadFile(fileHandle, threadPath);
      if (parsed) {
        messages.push(...parsed.messages);
        if (!participants.length) {
          participants = parsed.participants;
          title = parsed.title;
        }
      }

      fileCount++;
      const progress = Math.round((fileCount / totalFiles) * 100);
      postMessage({
        type: 'PROGRESS',
        progress,
        threadId: threadPath,
        data: { parsed: fileCount, total: totalFiles },
      });
    }

    // Sort all messages by timestamp
    messages.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    const result: ParsedThread = {
      threadId: threadPath,
      participants,
      messages,
      title,
    };

    logDebug('WORKER_COMPLETED', { threadPath, messageCount: messages.length });
    postMessage({
      type: 'THREAD_PARSED',
      data: result,
      threadId: threadPath,
    });

    return result;
  } catch (error: any) {
    logDebug('WORKER_ERROR', { threadPath, error });
    postMessage({
      type: 'WORKER_ERROR',
      error: error.message || 'Failed to parse thread',
      threadId: threadPath,
    });
    throw error;
  }
}


// Worker message handler
self.addEventListener('message', async (event: MessageEvent<ParseRequest>) => {
  const { type, directoryHandle, threadPath } = event.data;

  if (type === 'PARSE_THREAD') {
    try {
      // Navigate to the thread directory
      const pathParts = threadPath.split('/');
      let currentHandle = directoryHandle;

      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part);
      }

      await parseThreadDirectory(currentHandle, threadPath);
    } catch (error: any) {
      postMessage({
        type: 'WORKER_ERROR',
        error: error.message || 'Failed to access thread directory',
        threadId: threadPath,
      });
    }
  }
});

// Export empty object to make TypeScript happy
export {};
