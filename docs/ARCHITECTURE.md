# Architecture Documentation

## Overview

The Facebook Messenger Archive Viewer is built with a component-based React architecture that emphasizes performance, type safety, and local data processing. The application uses modern web APIs to provide a desktop-like experience entirely within the browser.

## Core Architectural Principles

### 1. Client-Side First
- All data processing happens in the browser
- No server-side dependencies for core functionality
- Files never leave the user's device
- Works offline after initial load

### 2. Progressive Loading
- Conversations are parsed on-demand using Web Workers
- Virtualized rendering for large conversation lists
- Streaming JSON parsing for better UX
- Background indexing for search functionality

### 3. Type Safety
- Comprehensive TypeScript coverage
- Runtime schema validation with Zod
- Strict type checking enabled
- Type-safe API contracts

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Environment                       │
├─────────────────────────────────────────────────────────────┤
│  React Application                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    Pages    │  │ Components  │  │   Context   │        │
│  │             │  │             │  │             │        │
│  │ • List      │  │ • Picker    │  │ • App State │        │
│  │ • View      │  │ • Search    │  │ • Threads   │        │
│  │             │  │ • Messages  │  │ • Loading   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Web Workers │  │   Parsers   │  │   Storage   │        │
│  │             │  │             │  │             │        │
│  │ • JSON      │  │ • Zod       │  │ • Memory    │        │
│  │ • Search    │  │ • Stream    │  │ • Local     │        │
│  │ • Index     │  │ • Validate  │  │ • Context   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Browser APIs                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   File      │  │   Worker    │  │   Storage   │        │
│  │   System    │  │    API      │  │     API     │        │
│  │   Access    │  │             │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initial Setup
```
User Selection → Folder Picker → Directory Handle → Context Storage
```

### 2. Conversation Discovery
```
Directory Scan → Thread Enumeration → Metadata Extraction → List Display
```

### 3. Message Parsing (On-Demand)
```
User Selection → Worker Spawn → JSON Parse → Validation → Context Storage → UI Update
```

### 4. Search Processing
```
Search Query → Fuse.js Index → Result Filtering → Highlight Rendering
```

## Component Architecture

### Core Components

#### App.tsx
- Root application component
- Router configuration
- Error boundary wrapper
- Context provider setup

#### AppContext.tsx
- Global state management
- Thread storage and retrieval
- Loading state coordination
- Parse progress tracking

### Page Components

#### ConversationList.tsx
- Thread metadata display
- Search and filtering
- Navigation to conversations
- Loading state management

#### ConversationView.tsx
- Message display coordination
- Search integration
- Timeline toggle
- Settings modal

### UI Components

#### FolderPicker.tsx
- File System Access API integration
- Directory validation
- Error handling and fallbacks
- User guidance

#### MessageList.tsx
- Virtual scrolling with react-virtuoso
- Search result highlighting
- Smooth scrolling to results
- Performance optimization

#### MessageBubble.tsx
- Individual message rendering
- Media attachment display
- Reaction display
- Type-specific formatting

#### SearchBar.tsx
- Real-time search input
- Fuzzy search integration
- Result navigation
- Search state management

#### TimelineHeatmap.tsx
- Calendar-based visualization
- Activity density mapping
- Interactive date selection
- Performance optimization

#### Settings.tsx
- API key management
- Configuration persistence
- Validation and testing
- Future feature toggles

### Utility Components

#### ErrorBoundary.tsx
- Application-level error catching
- Graceful degradation
- Error reporting
- Recovery mechanisms

## Data Models

### Core Types (Zod Schemas)

```typescript
// Message structure from Facebook export
MessageSchema = {
  sender_name: string
  timestamp_ms: number
  content?: string
  photos?: Photo[]
  videos?: Video[]
  audio_files?: AudioFile[]
  reactions?: Reaction[]
  // ... additional fields
}

// Thread container
ThreadSchema = {
  participants: Participant[]
  messages: Message[]
  title?: string
  is_still_participant?: boolean
  thread_type?: string
  thread_path?: string
}
```

### Internal Types

```typescript
// Runtime thread representation
ParsedThread = {
  threadId: string
  participants: Participant[]
  messages: Message[]
  title?: string
}

// Thread list metadata
ThreadMetadata = {
  id: string
  participants: Participant[]
  lastMessageTime: number
  totalMessages: number
  title?: string
}
```

## State Management

### Context Structure
```
AppContext
├── directoryHandle: FileSystemDirectoryHandle
├── threads: Map<string, ParsedThread>
├── threadMetadata: ThreadMetadata[]
├── threadLoadingStates: Map<string, boolean>
└── parseProgress: Map<string, number>
```

### State Updates
- Immutable updates using functional setState
- Map-based storage for O(1) thread lookup
- Separate metadata for list performance
- Progress tracking for UX feedback

## Performance Optimizations

### Virtual Scrolling
- `react-virtuoso` for message lists
- Handles thousands of messages efficiently
- Smooth scrolling and navigation
- Dynamic item sizing

### Web Workers
- Background JSON parsing
- Non-blocking UI updates
- Progress reporting
- Error isolation

### Search Optimization
- `Fuse.js` for fuzzy searching
- Configurable search thresholds
- Debounced input handling
- Result caching

### Memory Management
- Lazy loading of conversation data
- Cleanup of unused threads
- Efficient data structures
- Garbage collection friendly

## File System Integration

### File System Access API
```typescript
// Modern browsers (Chrome/Edge 86+)
const dirHandle = await window.showDirectoryPicker({
  mode: 'read',
});

// Fallback for other browsers
<input 
  type="file" 
  webkitdirectory 
  onChange={handleFolderSelect}
/>
```

### Directory Structure
```
messages/
├── conversation_1/
│   ├── message_1.json
│   ├── message_2.json
│   └── photos/
├── conversation_2/
│   ├── message_1.json
│   └── videos/
└── ...
```

## Web Worker Architecture

### Parser Worker (parser.worker.ts)
```typescript
// Message handling
self.onmessage = (event) => {
  const { dirHandle, threadPath } = event.data;
  parseThreadDirectory(dirHandle, threadPath);
};

// Progress reporting
self.postMessage({
  type: 'PROGRESS',
  threadId,
  progress: percentage
});

// Result delivery
self.postMessage({
  type: 'THREAD_PARSED',
  data: parsedThread
});
```

### Worker Communication
- Structured message passing
- Type-safe communication contracts
- Error propagation
- Progress tracking

## Security Considerations

### Data Privacy
- No external data transmission
- Local-only processing
- Optional API integrations
- User-controlled storage

### Input Validation
- Zod schema validation
- File type checking
- Directory structure validation
- Error boundary protection

### Memory Safety
- Bounded memory usage
- Cleanup mechanisms
- Worker isolation
- Resource management

## Browser Compatibility

### Modern Features
- File System Access API (Chrome/Edge 86+)
- Web Workers (Universal)
- ES Modules (Universal)
- IndexedDB (Universal)

### Progressive Enhancement
- Graceful degradation for older browsers
- Fallback UI components
- Feature detection
- Polyfill strategies

## Development Workflow

### Build Process
```bash
npm run dev      # Development server with HMR
npm run build    # Production build with optimization
npm run preview  # Preview production build
```

### Code Quality
```bash
npm run lint     # ESLint checking
npm run format   # Prettier formatting
npm run test     # Unit tests with Vitest
npm run cypress  # E2E tests
```

### Type Checking
- TypeScript strict mode enabled
- Runtime validation with Zod
- Comprehensive type coverage
- Build-time error prevention

## Future Architecture Considerations

### Extensibility Points
- Plugin architecture for new features
- Configurable data processors
- Themeable UI components
- Modular search backends

### Performance Scaling
- IndexedDB for large datasets
- Service Worker caching
- Streaming data processing
- Background synchronization

### Feature Integration
- AI-powered semantic search
- Advanced analytics
- Export capabilities
- Cloud synchronization options