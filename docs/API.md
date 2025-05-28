# Component API Reference

This document provides detailed API documentation for all components in the Facebook Messenger Archive Viewer application.

## Table of Contents

- [Core Components](#core-components)
- [Page Components](#page-components)
- [UI Components](#ui-components)
- [Context & Hooks](#context--hooks)
- [Types & Schemas](#types--schemas)
- [Utilities](#utilities)

## Core Components

### App
**File**: `src/App.tsx`

Main application component that provides routing and global context.

```typescript
function App(): JSX.Element
```

**Features**:
- React Router DOM setup
- AppProvider context wrapper
- Error boundary integration
- Global styling with Chakra UI

---

### AppProvider
**File**: `src/context/AppContext.tsx`

Global state management provider for the application.

```typescript
interface AppProviderProps {
  children: ReactNode;
}

function AppProvider({ children }: AppProviderProps): JSX.Element
```

**Context Value**:
```typescript
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
}
```

**Methods**:
- `addThread(thread)`: Adds a parsed thread and updates metadata
- `getThread(threadId)`: Retrieves a thread by ID
- `isThreadLoading(threadId)`: Checks if a thread is currently loading
- `setThreadLoading(threadId, loading)`: Updates thread loading state
- `setParseProgress(threadId, progress)`: Updates parsing progress (0-100)

---

## Page Components

### ConversationList
**File**: `src/pages/ConversationList.tsx`

Displays list of all conversations with search and filtering capabilities.

```typescript
function ConversationList(): JSX.Element
```

**Features**:
- Thread metadata display
- Search functionality
- Sort by last message time
- Loading states with progress indicators
- Navigation to individual conversations

**State Management**:
- Uses `useAppContext()` for thread data
- Local state for search filtering
- Automatic refresh when new threads are parsed

---

### ConversationView
**File**: `src/pages/ConversationView.tsx`

Main conversation view with messages, search, and timeline.

```typescript
function ConversationView(): JSX.Element
```

**URL Parameters**:
- `threadId`: The conversation thread ID to display

**Features**:
- Message list with virtual scrolling
- Integrated search bar
- Timeline heatmap toggle
- Settings modal
- Loading states and error handling

**Sub-components**:
- `MessageList`: Virtualized message display
- `SearchBar`: Real-time search interface
- `TimelineHeatmap`: Activity visualization
- `Settings`: Configuration modal

---

## UI Components

### FolderPicker
**File**: `src/components/FolderPicker.tsx`

Entry point component for selecting the Facebook messages directory.

```typescript
function FolderPicker(): JSX.Element
```

**Features**:
- File System Access API integration
- Fallback file input for unsupported browsers
- Directory validation
- Error handling and user guidance
- Automatic navigation on successful selection

**Browser Support**:
- Modern browsers: Direct folder selection
- Legacy browsers: File input with `webkitdirectory`

**Validation**:
- Checks for `messages` directory structure
- Validates Facebook export format
- Provides helpful error messages

---

### MessageList
**File**: `src/components/MessageList.tsx`

Virtualized list component for displaying conversation messages.

```typescript
interface MessageListProps {
  messages: Message[];
  searchQuery: string;
}

function MessageList({ messages, searchQuery }: MessageListProps): JSX.Element
```

**Props**:
- `messages`: Array of message objects to display
- `searchQuery`: Current search query for highlighting

**Features**:
- Virtual scrolling with `react-virtuoso`
- Fuzzy search with `Fuse.js`
- Search result highlighting
- Smooth scrolling to search results
- Performance optimization for large conversations

**Search Configuration**:
```typescript
const fuseOptions = {
  keys: ['content', 'sender_name'],
  threshold: 0.4,
  includeScore: true,
};
```

**Ref Methods**:
```typescript
VirtuosoHandle {
  scrollToIndex: (params: { index: number; behavior?: 'auto' | 'smooth'; align?: 'start' | 'center' | 'end' }) => void;
}
```

---

### MessageBubble
**File**: `src/components/MessageBubble.tsx`

Individual message display component with media support.

```typescript
interface MessageBubbleProps {
  message: Message;
  isHighlighted?: boolean;
  searchQuery?: string;
}

function MessageBubble({ message, isHighlighted, searchQuery }: MessageBubbleProps): JSX.Element
```

**Props**:
- `message`: Message object to render
- `isHighlighted`: Whether to highlight this message (search results)
- `searchQuery`: Search query for text highlighting

**Supported Message Types**:
- Text messages with emoji support and encoding fixes
- Photo attachments (with lightbox gallery and click-to-expand)
- Video attachments (with ReactPlayer and lightbox fullscreen)
- Audio files (with ReactPlayer controls)
- Stickers and GIFs (with proper sizing)
- File attachments (with download functionality)
- Call records (with duration formatting)
- Grouped reactions display (with tooltips and counts)

**Media Handling**:
- FileSystem API integration for local file access
- Object URL management for browser display
- Lazy loading for performance
- Error fallbacks for missing files
- Responsive sizing (videos: base 100%, sm 320px, md 480px)
- Memory management with automatic cleanup
- Lightbox integration with Video plugin support

**Encoding Features**:
- Automatic mojibake detection and repair
- Unicode character restoration for international text
- Reaction emoji decoding
- Sender name correction

**Sub-Components**:
- `MediaItem`: Handles individual media rendering and click events
- `LightboxSlide`: Mixed media support for photos and videos
- `GroupedReactions`: Emoji-based reaction grouping with tooltips

---

### SearchBar
**File**: `src/components/SearchBar.tsx`

Real-time search input component.

```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

function SearchBar({ value, onChange, placeholder, isLoading }: SearchBarProps): JSX.Element
```

**Props**:
- `value`: Current search query
- `onChange`: Callback for search value changes
- `placeholder`: Input placeholder text
- `isLoading`: Loading state indicator

**Features**:
- Debounced input handling
- Clear button
- Loading spinner
- Keyboard shortcuts
- Accessibility support

---

### TimelineHeatmap
**File**: `src/components/TimelineHeatmap.tsx`

Calendar heatmap visualization for conversation activity.

```typescript
interface TimelineHeatmapProps {
  messages: Message[];
}

function TimelineHeatmap({ messages }: TimelineHeatmapProps): JSX.Element
```

**Props**:
- `messages`: Array of messages to visualize

**Features**:
- Daily activity aggregation
- Color-coded intensity levels
- Interactive date selection
- Tooltip with message counts
- Year navigation
- Responsive layout

**Data Processing**:
- Groups messages by date
- Calculates activity density
- Handles timezone considerations
- Performance optimization for large datasets

---

### Settings
**File**: `src/components/Settings.tsx`

Configuration modal for application settings.

```typescript
interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

function Settings({ isOpen, onClose }: SettingsProps): JSX.Element
```

**Props**:
- `isOpen`: Modal visibility state
- `onClose`: Callback to close modal

**Features**:
- OpenRouter API key management
- API key validation
- Local storage persistence
- Connection testing
- Future feature toggles

**API Integration**:
```typescript
// Validates API key by testing connection
const validateApiKey = async (key: string): Promise<boolean> => {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    method: 'HEAD',
    headers: { Authorization: `Bearer ${key}` },
  });
  return response.ok;
};
```

---

### ErrorBoundary
**File**: `src/components/ErrorBoundary.tsx`

React error boundary for graceful error handling.

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState>
```

**Props**:
- `children`: Components to wrap
- `fallback`: Custom error UI (optional)

**Features**:
- Error catching and logging
- Graceful degradation
- Error reporting
- Recovery mechanisms
- Development vs. production modes

### MediaItem
**File**: `src/components/MessageBubble.tsx` (Sub-component)

Individual media file rendering component with FileSystem API integration.

```typescript
interface MediaItemProps {
  uri: string;
  altText: string;
  itemType: 'photo' | 'video' | 'audio' | 'gif' | 'sticker' | 'file';
  onMediaClick?: () => void; // For photos, videos, gifs to open lightbox
  fileName?: string; // For file attachments
}

function MediaItem({ uri, altText, itemType, onMediaClick, fileName }: MediaItemProps): JSX.Element
```

**Props**:
- `uri`: Normalized media URI (relative to messages directory)
- `altText`: Accessibility description
- `itemType`: Type of media for appropriate rendering
- `onMediaClick`: Callback for media interaction (lightbox)
- `fileName`: Original filename for downloads

**Features**:
- **URI Resolution**: Converts normalized URIs to File objects using directoryHandle
- **Object URL Management**: Creates and cleans up blob URLs automatically
- **Loading States**: Shows skeleton placeholders during file loading
- **Error Handling**: Displays fallback UI for missing/corrupted files
- **Responsive Design**: Adaptive sizing based on media type and screen size
- **Memory Safety**: Automatic cleanup of object URLs on unmount

**Media Type Handling**:
```typescript
// Photos, GIFs, Stickers
<Image 
  src={objectUrl} 
  onClick={onMediaClick}
  maxH={itemType === 'sticker' ? "100px" : "200px"}
/>

// Videos (enhanced with responsive sizing)
<Box onClick={onMediaClick} maxW={{ base: '100%', sm: '320px', md: '480px' }}>
  <AspectRatio ratio={16/9}>
    <ReactPlayer url={objectUrl} controls />
  </AspectRatio>
</Box>

// Audio
<ReactPlayer 
  url={objectUrl} 
  controls 
  config={{ file: { forceAudio: true } }}
/>

// Files
<Button as={Link} href={objectUrl} download={fileName}>
  {fileName || 'Download File'}
</Button>
```

---

### LightboxSlide Interface
**File**: `src/components/MessageBubble.tsx`

Type definition for mixed media lightbox slides.

```typescript
interface LightboxSlide {
  src?: string;           // For images
  alt?: string;           // Accessibility description
  type?: 'image' | 'video'; // Media type
  sources?: {             // For videos
    src: string;
    type: string;         // MIME type (e.g., 'video/mp4')
  }[];
}
```

**Usage**:
```typescript
// Photo slide
{ src: "blob:...", type: "image", alt: "Photo 1 from Alice" }

// Video slide  
{ 
  type: "video", 
  alt: "Video 1 from Bob",
  sources: [{ src: "blob:...", type: "video/mp4" }]
}
```

**Features**:
- **Mixed Media**: Supports both images and videos in same gallery
- **Video Plugin**: Integrates with yet-another-react-lightbox Video plugin
- **Type Safety**: Proper TypeScript types for lightbox library compatibility
- **Memory Management**: Automatic cleanup of blob URLs when lightbox closes

---

## Context & Hooks

### useAppContext
**File**: `src/context/AppContext.tsx`

Hook to access the global application context.

```typescript
function useAppContext(): AppContextType
```

**Returns**: Application context with state and methods

**Throws**: Error if used outside of `AppProvider`

---

### useMessageParser
**File**: `src/hooks/useMessageParser.ts`

Hook for parsing Facebook message data using Web Workers.

```typescript
interface UseMessageParserReturn {
  parseThread: (dirHandle: FileSystemDirectoryHandle, threadPath: string) => Promise<void>;
  scanDirectory: (dirHandle: FileSystemDirectoryHandle) => Promise<string[]>;
  isWorkerSupported: boolean;
}

function useMessageParser(): UseMessageParserReturn
```

**Methods**:
- `parseThread(dirHandle, threadPath)`: Parse a specific conversation thread
- `scanDirectory(dirHandle)`: Scan directory for conversation folders
- `isWorkerSupported`: Check if Web Workers are available

**Features**:
- Web Worker integration
- Progress reporting
- Error handling
- Fallback for unsupported browsers

---

## Types & Schemas

### Message Types
**File**: `src/types/messenger.ts`

Zod schemas and TypeScript types for Facebook Messenger data.

```typescript
// Core message structure
interface Message {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  photos?: Photo[];
  videos?: Video[];
  audio_files?: AudioFile[];
  reactions?: Reaction[];
  is_unsent?: boolean;
  type?: string;
  sticker?: { uri: string };
  gifs?: { uri: string }[];
  files?: Attachment[];
  call_duration?: number;
}

// Thread container
interface Thread {
  participants: Participant[];
  messages: Message[];
  title?: string;
  is_still_participant?: boolean;
  thread_type?: string;
  thread_path?: string;
}

// Runtime types
interface ParsedThread {
  threadId: string;
  participants: Participant[];
  messages: Message[];
  title?: string;
}

interface ThreadMetadata {
  id: string;
  participants: Participant[];
  lastMessageTime: number;
  totalMessages: number;
  title?: string;
}
```

### Worker Messages
```typescript
interface WorkerMessage {
  type: 'THREAD_PARSED' | 'WORKER_ERROR' | 'WORKER_COMPLETED' | 'PROGRESS';
  data?: any;
  error?: string;
  threadId?: string;
  progress?: number;
}
```

---

## Utilities

### Logger
**File**: `src/utils/logger.ts`

Centralized logging utility for debugging and monitoring.

```typescript
interface Logger {
  debug: (event: string, data?: any) => void;
  info: (event: string, data?: any) => void;
  warn: (event: string, data?: any) => void;
  error: (event: string, error?: any) => void;
}

const logger: Logger
```

**Log Levels**:
- `debug`: Development debugging
- `info`: General information
- `warn`: Warning conditions
- `error`: Error conditions

**Features**:
- Structured logging format
- Development vs. production modes
- Console output with formatting
- Event-based logging patterns

---

### Encoding Utilities
**File**: `src/utils/encoding.ts`

Utilities for fixing Facebook's mojibake character encoding issues.

```typescript
function fixEncoding(text: string): string
function readFileWithProperEncoding(file: File): Promise<string>
```

**`fixEncoding(text)`**:
- Fixes Facebook's mojibake using `decodeURIComponent(escape(text))`
- Handles UTF-8 text incorrectly interpreted as windows-1252
- Returns corrected text with proper Polish/international characters
- Used throughout the application for all text fields

**`readFileWithProperEncoding(file)`**:
- Reads file and applies mojibake fixes to entire content
- Applied before JSON parsing for maximum effectiveness
- Logs encoding fixes to console for debugging
- Used in worker thread for optimal performance

**`normalizeAssetUri(uri)`** (Worker function):
- Normalizes Facebook export media URIs to be relative to messages directory
- Strips "your_facebook_activity/messages/" prefix from asset paths
- Handles edge cases like stickers_used/ paths
- Returns paths suitable for FileSystem API navigation

**Examples**:
```typescript
// Text encoding fix
const fixed = fixEncoding("wÅ‚osy"); // "włosy" (Polish)
const emoji = fixEncoding("ðŸ˜‚");    // "😂" (emoji)

// URI normalization
const normalized = normalizeAssetUri("your_facebook_activity/messages/inbox_alice/photos/pic.jpg");
// Returns: "inbox_alice/photos/pic.jpg"
```

**Worker Integration**:
```typescript
// Applied to all message fields in parser worker
const message = {
  sender_name: fixEncoding(rawMessage.sender_name),
  content: fixEncoding(rawMessage.content),
  photos: rawMessage.photos?.map(p => ({ 
    ...p, 
    uri: normalizeAssetUri(p.uri) 
  })),
  reactions: rawMessage.reactions?.map(r => ({
    reaction: fixEncoding(r.reaction), // Fix emoji
    actor: fixEncoding(r.actor)       // Fix actor name
  }))
};
```

**How encoding fix works**:
1. `escape("Å¼")` → `"%C5%BC"` (percent-encode corrupted bytes)
2. `decodeURIComponent("%C5%BC")` → `"ż"` (decode as proper UTF-8)
3. Fallback to original text if decoding fails

**Features**:
- Automatic mojibake detection and repair
- Comprehensive logging of fixes applied
- Worker-level performance optimization
- Fallback error handling for corrupted data
- Media URI normalization for FileSystem API
- Optimized for Facebook export patterns and Polish text

---

### File System Types
**File**: `src/types/file-system.d.ts`

TypeScript declarations for File System Access API.

```typescript
interface FileSystemDirectoryHandle {
  readonly kind: 'directory';
  readonly name: string;
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  getDirectoryHandle(name: string): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string): Promise<FileSystemFileHandle>;
}

interface FileSystemFileHandle {
  readonly kind: 'file';
  readonly name: string;
  getFile(): Promise<File>;
}

interface Window {
  showDirectoryPicker(options?: {
    mode?: 'read' | 'readwrite';
  }): Promise<FileSystemDirectoryHandle>;
}
```

---

## Best Practices

### Component Usage
1. **Context Access**: Always use `useAppContext()` hook instead of direct context access
2. **Error Handling**: Wrap async operations in try-catch blocks
3. **Performance**: Use React.memo() for expensive components
4. **Type Safety**: Validate external data with Zod schemas

### State Management
1. **Immutability**: Use functional setState patterns
2. **Cleanup**: Clear loading states and progress on completion
3. **Memory**: Remove unused thread data periodically
4. **Updates**: Batch state updates when possible

### Worker Integration
1. **Error Handling**: Always handle worker errors gracefully
2. **Cleanup**: Terminate workers when done
3. **Progress**: Report progress for long operations
4. **Fallbacks**: Provide main thread fallbacks

### Performance
1. **Virtual Scrolling**: Use for large data sets
2. **Lazy Loading**: Load data on demand
3. **Debouncing**: Debounce user input
4. **Memoization**: Cache expensive calculations