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

// Add this helper function to normalize asset URIs
function normalizeAssetUri(uri: string | undefined): string | undefined {
  if (!uri) return undefined;
  const messagesSegment = 'messages/';
  const messagesIndex = uri.indexOf(messagesSegment);
  if (messagesIndex !== -1) {
    return uri.substring(messagesIndex + messagesSegment.length);
  }
  // If "messages/" is not found, it might be an external URL or already relative.
  // Or it could be from a different export structure. For now, log a warning and return as is.
  // This covers cases like stickers that might already have a path relative to 'messages' if they are in 'stickers_used'
  if (uri.startsWith('stickers_used/')) { // Stickers are directly under 'messages'
    return uri;
  }
  
  logDebug('UNEXPECTED_URI_FORMAT', { uri });
  // Potentially return uri or an empty string/undefined if it's an error
  // For safety, let's return the original uri if it doesn't match the expected pattern,
  // so external URLs (if any) are not broken.
  return uri;
}

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
      participants: validatedData.participants.map((p) => ({
        ...p,
        name: fixEncoding(p.name), // Fix participant names
      })),
      messages: validatedData.messages
        .map((m) => ({
          ...m,
          sender_name: fixEncoding(m.sender_name), // Fix sender names
          content: m.content ? fixEncoding(m.content) : undefined, // Ensure undefined if not present
          photos: m.photos?.map(p => ({ ...p, uri: normalizeAssetUri(p.uri) || p.uri /* fallback */ })),
          videos: m.videos?.map(v => ({ ...v, uri: normalizeAssetUri(v.uri) || v.uri })),
          audio_files: m.audio_files?.map(a => ({ ...a, uri: normalizeAssetUri(a.uri) || a.uri })),
          gifs: m.gifs?.map(g => ({ ...g, uri: normalizeAssetUri(g.uri) || g.uri })),
          files: m.files?.map(f => ({ ...f, uri: normalizeAssetUri(f.uri) || f.uri })),
          sticker: m.sticker ? { ...m.sticker, uri: normalizeAssetUri(m.sticker.uri) || m.sticker.uri } : undefined,
          reactions: m.reactions?.map(r => ({ 
            ...r, 
            reaction: fixEncoding(r.reaction), 
            actor: fixEncoding(r.actor) 
          })),
        }))
        .sort((a, b) => a.timestamp_ms - b.timestamp_ms), // Sorting remains
      title: safeTitle,
    };
  } catch (error: any) {
    logDebug('PARSE_ERROR in parseThreadFile', {
      threadId,
      fileName: fileHandle.name,
      errorMessage: error.message,
      errorStack: error.stack,
    });
    if (error instanceof SyntaxError) {
      console.error(
        `[Worker] JSON Parsing Error for file ${fileHandle.name}. Problematic text sample (first 500 chars):\n`,
        rawTextForDebug.substring(0, 500),
      );
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
