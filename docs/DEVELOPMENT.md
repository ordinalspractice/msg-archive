# Development Guide

This guide provides detailed information for developers working on the Facebook Messenger Archive Viewer codebase.

## Code Architecture

### Component Hierarchy

```
App
├── AppProvider (Context)
├── Router
│   ├── / → FolderPicker
│   ├── /conversations → ConversationList
│   └── /conversation/:threadId → ConversationView
│       ├── MessageList
│       │   └── MessageBubble[]
│       ├── SearchBar
│       ├── TimelineHeatmap
│       └── Settings (Modal)
└── ErrorBoundary
```

### Data Flow

1. **User selects folder** → `FolderPicker` → `AppContext.setDirectoryHandle`
2. **Scan directory** → `useMessageParser.scanDirectory` → Thread metadata
3. **User selects conversation** → Navigate to `/conversation/:threadId`
4. **Load messages** → `useMessageParser.parseThread` → Web Worker → `AppContext.addThread`
5. **Display messages** → `MessageList` with virtualization
6. **Search messages** → `SearchBar` → Fuse.js → Highlight results

### State Management

**Global State (AppContext)**:
- `directoryHandle`: File system access
- `threads`: Parsed conversation data
- `threadMetadata`: Conversation summaries
- `loadingStates`: Per-thread loading status
- `parseProgress`: Parsing progress tracking

**Local State**:
- Component-specific UI state
- Form inputs and temporary data
- Search queries and filters

## Key Design Patterns

### Encoding and Media Processing

```typescript
// Encoding fix pattern for mojibake
const processMessage = (rawMessage: any) => ({
  sender_name: fixEncoding(rawMessage.sender_name),
  content: fixEncoding(rawMessage.content),
  reactions: rawMessage.reactions?.map(r => ({
    reaction: fixEncoding(r.reaction), // Fix emoji
    actor: fixEncoding(r.actor)       // Fix actor name
  }))
});

// Media URI normalization in worker
const normalizedMessage = {
  ...message,
  photos: message.photos?.map(p => ({ 
    ...p, 
    uri: normalizeAssetUri(p.uri) 
  })),
  videos: message.videos?.map(v => ({ 
    ...v, 
    uri: normalizeAssetUri(v.uri) 
  }))
};

// Object URL management pattern
useEffect(() => {
  let objectUrl: string | null = null;
  
  const loadMedia = async () => {
    const file = await resolveFileFromUri(uri, directoryHandle);
    objectUrl = URL.createObjectURL(file);
    setMediaUrl(objectUrl);
  };
  
  loadMedia();
  
  return () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  };
}, [uri, directoryHandle]);
```

### Grouped Reactions Pattern

```typescript
// Reaction grouping with memoization
const groupedReactions = useMemo(() => {
  const reactionMap = new Map<string, string[]>();
  
  message.reactions?.forEach(reaction => {
    const emoji = reaction.reaction; // Already decoded
    const actor = reaction.actor;   // Already decoded
    
    if (reactionMap.has(emoji)) {
      reactionMap.get(emoji)!.push(actor);
    } else {
      reactionMap.set(emoji, [actor]);
    }
  });

  return Array.from(reactionMap.entries()).map(([emoji, actors]) => ({
    emoji, actors, count: actors.length
  }));
}, [message.reactions]);
```

### Media Component Pattern

```typescript
// Unified media component with type switching
const MediaItem: FC<MediaItemProps> = ({ uri, itemType, onMediaClick }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // File loading and object URL creation
    // Automatic cleanup on unmount
  }, [uri]);
  
  switch (itemType) {
    case 'photo':
      return <Image src={objectUrl} onClick={onMediaClick} />;
    case 'video':
      return (
        <Box onClick={onMediaClick} maxW={{ base: '100%', sm: '320px', md: '480px' }}>
          <AspectRatio ratio={16/9}>
            <ReactPlayer url={objectUrl} controls />
          </AspectRatio>
        </Box>
      );
    case 'audio':
      return <ReactPlayer url={objectUrl} config={{ file: { forceAudio: true } }} />;
    default:
      return null;
  }
};
```

### Error Boundaries
```typescript
// Wrap components that might throw
<ErrorBoundary fallback={<ErrorUI />}>
  <RiskyComponent />
</ErrorBoundary>
```

### Context Pattern
```typescript
// Access global state
const { threads, addThread } = useAppContext();

// Custom hooks for specific functionality
const { parseThread, isWorkerSupported } = useMessageParser();
```

### Render Props / Children as Functions
```typescript
// Flexible component composition
<DataProvider>
  {({ data, loading, error }) => (
    loading ? <Spinner /> : <DataDisplay data={data} />
  )}
</DataProvider>
```

## Performance Considerations

### Virtual Scrolling
- Use `react-virtuoso` for large lists
- Configure `overscan` for smooth scrolling
- Implement `itemContent` efficiently

### Web Workers
- Offload heavy JSON parsing
- Report progress for UX
- Handle errors gracefully
- Clean up workers when done

### Memory Management
- Clean up unused thread data
- Use Map for O(1) lookups  
- Implement lazy loading
- Monitor memory usage in DevTools
- **Object URL Management**: Automatic cleanup of blob URLs for media files
- **Media Resource Cleanup**: Revoke object URLs when components unmount
- **Lightbox Memory**: Cleanup slides when lightbox closes

### Bundle Optimization
- Code splitting by route
- Tree shaking unused imports
- Lazy load heavy components
- Optimize assets (images, fonts)

## Testing Strategy

### Unit Tests
```typescript
// Test individual components
describe('MessageBubble', () => {
  it('renders text messages correctly', () => {
    render(<MessageBubble message={mockMessage} />);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
  
  it('renders grouped reactions correctly', () => {
    const messageWithReactions = {
      ...mockMessage,
      reactions: [
        { reaction: '😂', actor: 'Alice' },
        { reaction: '😂', actor: 'Bob' },
        { reaction: '❤️', actor: 'Charlie' }
      ]
    };
    render(<MessageBubble message={messageWithReactions} />);
    expect(screen.getByText('😂')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
  
  it('handles media items with loading states', async () => {
    const messageWithPhoto = {
      ...mockMessage,
      photos: [{ uri: 'test/photo.jpg', creation_timestamp: 123456789 }]
    };
    render(<MessageBubble message={messageWithPhoto} />);
    expect(screen.getByTestId('media-skeleton')).toBeInTheDocument();
  });
});

// Test media component
describe('MediaItem', () => {
  const mockDirectoryHandle = {
    getDirectoryHandle: jest.fn(),
    getFileHandle: jest.fn(),
  };
  
  beforeEach(() => {
    // Mock FileSystem API
    mockDirectoryHandle.getFileHandle.mockResolvedValue({
      getFile: () => Promise.resolve(new File([''], 'test.jpg', { type: 'image/jpeg' }))
    });
  });
  
  it('creates object URL for photos', async () => {
    const spyCreateObjectURL = jest.spyOn(URL, 'createObjectURL');
    render(<MediaItem uri="test.jpg" itemType="photo" altText="Test photo" />);
    
    await waitFor(() => {
      expect(spyCreateObjectURL).toHaveBeenCalled();
    });
  });
  
  it('cleans up object URLs on unmount', async () => {
    const spyRevokeObjectURL = jest.spyOn(URL, 'revokeObjectURL');
    const { unmount } = render(<MediaItem uri="test.jpg" itemType="photo" altText="Test photo" />);
    
    unmount();
    
    await waitFor(() => {
      expect(spyRevokeObjectURL).toHaveBeenCalled();
    });
  });
});

// Test encoding utilities
describe('fixEncoding', () => {
  it('fixes Polish characters', () => {
    expect(fixEncoding('wÅ‚osy')).toBe('włosy');
    expect(fixEncoding('miÅ‚oÅ›Ä‡')).toBe('miłość');
  });
  
  it('fixes emoji characters', () => {
    expect(fixEncoding('ðŸ˜‚')).toBe('😂');
    expect(fixEncoding('â¤ï¸')).toBe('❤️');
  });
  
  it('returns original text if decoding fails', () => {
    expect(fixEncoding('normal text')).toBe('normal text');
  });
});

// Test hooks
describe('useMessageParser', () => {
  it('parses valid message files', async () => {
    const { parseThread } = renderHook(() => useMessageParser());
    // Test implementation
  });
  
  it('normalizes media URIs in worker', async () => {
    const mockWorker = {
      postMessage: jest.fn(),
      onmessage: null,
      terminate: jest.fn(),
    };
    
    // Test worker message handling
    const messageData = {
      photos: [{ uri: 'your_facebook_activity/messages/inbox/photo.jpg' }]
    };
    
    // Simulate worker processing
    const normalized = normalizeAssetUri(messageData.photos[0].uri);
    expect(normalized).toBe('inbox/photo.jpg');
  });
});
```

### Integration Tests
```typescript
// Test component interactions
describe('ConversationView', () => {
  it('displays messages after loading', async () => {
    render(<ConversationView />);
    await waitFor(() => {
      expect(screen.getByText('Loading...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Message content')).toBeInTheDocument();
  });
});
```

### E2E Tests
```typescript
// cypress/e2e/conversation-flow.cy.ts
describe('Conversation Flow', () => {
  it('loads and displays conversations', () => {
    cy.visit('/');
    cy.get('[data-testid="folder-picker"]').click();
    cy.get('[data-testid="conversation-list"]').should('be.visible');
    cy.get('[data-testid="conversation-item"]').first().click();
    cy.get('[data-testid="message-list"]').should('be.visible');
  });
});
```

## Code Style Guidelines

### TypeScript Best Practices

```typescript
// Use strict typing
interface ComponentProps {
  messages: Message[];
  onSelect: (messageId: string) => void;
}

// Prefer type-only imports when possible
import type { FC } from 'react';
import type { Message } from '../types/messenger';

// Use discriminated unions for complex types
type MessageType = 
  | { type: 'text'; content: string }
  | { type: 'media'; files: FileAttachment[] }
  | { type: 'system'; action: string };

// Use utility types
type PartialMessage = Partial<Message>;
type MessageKeys = keyof Message;
```

### React Patterns

```typescript
// Prefer function components with hooks
const MessageBubble: FC<MessageBubbleProps> = ({ message }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Box onClick={() => setExpanded(!expanded)}>
      {/* Component content */}
    </Box>
  );
};

// Use callback dependencies correctly
const handleSearch = useCallback((query: string) => {
  // Search logic
}, [messages]); // Include all dependencies

// Memoize expensive calculations
const searchResults = useMemo(() => {
  return fuse.search(searchQuery);
}, [searchQuery, messages]);
```

### Error Handling

```typescript
// Component-level error handling
const [error, setError] = useState<string | null>(null);

try {
  const result = await riskyOperation();
  setError(null);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Unknown error');
  logger.error('OPERATION_FAILED', err);
}

// Graceful degradation
if (!isWorkerSupported) {
  return <FallbackComponent />;
}
```

### Accessibility

```typescript
// Semantic HTML and ARIA attributes
<button
  aria-label="Search messages"
  aria-expanded={isSearchOpen}
  onClick={handleSearchToggle}
>
  <SearchIcon />
</button>

// Keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleSubmit();
  }
  if (event.key === 'Escape') {
    handleCancel();
  }
};
```

## File Organization

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI primitives
│   ├── forms/          # Form-specific components
│   └── layout/         # Layout components
├── pages/              # Route-level components
├── hooks/              # Custom React hooks
├── context/            # React Context providers
├── utils/              # Pure utility functions
├── types/              # TypeScript type definitions
├── constants/          # Application constants
├── config/             # Configuration files
└── __tests__/          # Test utilities and setup
```

### Import Organization
```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

// 2. Internal modules (absolute imports)
import { useAppContext } from '@/context/AppContext';
import { logger } from '@/utils/logger';
import type { Message } from '@/types/messenger';

// 3. Relative imports
import { MessageBubble } from './MessageBubble';
import { SearchBar } from '../SearchBar';
```

## API Integration

### OpenRouter Integration (Future)
```typescript
// API client setup
class OpenRouterClient {
  constructor(private apiKey: string) {}

  async searchMessages(query: string, messages: Message[]): Promise<SearchResult[]> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [{
          role: 'user',
          content: `Search for: ${query} in these messages: ${JSON.stringify(messages.slice(0, 10))}`
        }]
      })
    });
    
    return response.json();
  }
}
```

### Configuration Management
```typescript
// Environment-specific config
export const config = {
  development: {
    apiUrl: 'http://localhost:3000/api',
    debugLogging: true,
    enableMockData: true,
  },
  production: {
    apiUrl: 'https://api.example.com',
    debugLogging: false,
    enableMockData: false,
  },
  test: {
    apiUrl: 'http://localhost:3001/api',
    debugLogging: false,
    enableMockData: true,
  },
};
```

## Development Workflow

### Feature Development
1. Create feature branch: `git checkout -b feature/new-feature`
2. Implement changes with tests
3. Run quality checks: `npm run lint && npm run test`
4. Commit with conventional format: `feat: add new feature`
5. Push and create pull request

### Code Review Process
- [ ] Functionality works as expected
- [ ] Tests cover new/changed code
- [ ] TypeScript types are accurate
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met
- [ ] Error handling implemented
- [ ] Documentation updated

### Release Process
1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release tag
4. Build and deploy to staging
5. Validate functionality
6. Deploy to production

## Debugging Techniques

### Browser DevTools
```typescript
// Add debug helpers to window (development only)
if (import.meta.env.DEV) {
  window.__DEBUG__ = {
    appContext: useAppContext,
    logger,
    config,
  };
}
```

### Performance Profiling
```typescript
// Measure component render time
const PerformanceWrapper: FC<{ name: string; children: ReactNode }> = ({ name, children }) => {
  useEffect(() => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      logger.debug('COMPONENT_RENDER_TIME', { component: name, duration: end - start });
    };
  });
  
  return <>{children}</>;
};
```

### Error Tracking
```typescript
// Centralized error reporting
const reportError = (error: Error, context?: Record<string, any>) => {
  logger.error('APPLICATION_ERROR', { error: error.message, stack: error.stack, context });
  
  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    // Send to Sentry, LogRocket, etc.
  }
};
```

## Security Considerations

### Input Validation
```typescript
// Validate all external data
const validateMessage = (data: unknown): Message => {
  const result = MessageSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid message format: ${result.error.message}`);
  }
  return result.data;
};
```

### Content Security Policy
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' https://openrouter.ai;
  worker-src 'self' blob:;
">
```

### Data Privacy
- All processing happens client-side
- No data sent to external servers (except optional OpenRouter)
- Local storage only for user preferences
- Clear data handling policies

## Future Considerations

### Scalability
- Consider IndexedDB for large datasets
- Implement pagination for massive archives
- Add service worker for offline support
- Optimize bundle size as features grow

### Extensibility
- Plugin architecture for custom processors
- Configurable UI themes
- Export/import functionality
- Integration with other messaging platforms

### Monitoring
- Performance metrics collection
- Error tracking and reporting
- User analytics (privacy-respecting)
- Feature usage statistics

This development guide should be updated as the codebase evolves and new patterns emerge.