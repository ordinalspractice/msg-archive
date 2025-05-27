import { ThreadSchema, type ParsedThread, type WorkerMessage } from '../types/messenger';
import { readFileWithProperEncoding, fixEncoding } from '../utils/encoding';

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
  let rawTextForDebug = '';
  try {
    const file = await fileHandle.getFile();
    
    // Key approach: Fix encoding on the entire file content BEFORE JSON parsing
    // This matches the proven fbarch approach
    const fixedText = await readFileWithProperEncoding(file);
    rawTextForDebug = fixedText; // Save text for debugging

    // Parse the encoding-corrected JSON
    const data = JSON.parse(fixedText);
    const validatedData = ThreadSchema.parse(data);

    // Apply fixEncoding to individual fields as additional safety
    // (following fbarch pattern, even though whole file was already fixed)
    const safeTitle = validatedData.title ? fixEncoding(validatedData.title) : undefined;

    return {
      threadId,
      participants: validatedData.participants.map(p => ({
        ...p,
        name: fixEncoding(p.name) // Fix participant names
      })),
      messages: validatedData.messages
        .map(m => ({
          ...m,
          sender_name: fixEncoding(m.sender_name), // Fix sender names
          content: m.content ? fixEncoding(m.content) : m.content // Fix message content
        }))
        .sort((a, b) => a.timestamp_ms - b.timestamp_ms), // Sorting remains
      title: safeTitle,
    };
  } catch (error: any) {
    logDebug('PARSE_ERROR in parseThreadFile', { threadId, fileName: fileHandle.name, errorMessage: error.message, errorStack: error.stack });
    if (error instanceof SyntaxError) {
      console.error(`[Worker] JSON Parsing Error for file ${fileHandle.name}. Problematic text sample (first 500 chars):\n`, rawTextForDebug.substring(0, 500));
    }
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
        messageFiles.push(entry as FileSystemFileHandle);
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
