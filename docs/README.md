# Facebook Messenger Archive Viewer

A comprehensive, client-side web application for browsing, searching, and visualizing Facebook Messenger archives locally in your browser.

## Overview

This React + TypeScript application allows users to explore their downloaded Facebook Messenger data entirely within their browser, with no data ever leaving their device. The app provides powerful search capabilities, conversation visualization, and timeline analysis.

## Key Features

- **Client-Side Processing**: All data stays in your browser - no server uploads
- **Folder-Based Access**: Direct integration with Facebook's archive folder structure
- **Virtualized Rendering**: Handles conversations with thousands of messages efficiently
- **Fuzzy Search**: Fast, intelligent search across all conversations and messages
- **Timeline Visualization**: Interactive heatmap showing conversation activity over time
- **Media Support**: View photos, videos, and audio attachments inline
- **OpenRouter Integration**: Future support for AI-powered semantic search

## Technology Stack

### Core Framework
- **React 19.1.0** - UI framework with concurrent features
- **TypeScript 5.8** - Type-safe development
- **Vite 6.3** - Fast build tool and dev server

### UI & Styling
- **Chakra UI 2.10** - Component library and design system
- **Emotion** - CSS-in-JS styling
- **Framer Motion** - Smooth animations
- **React Icons** - Icon library

### Data Processing
- **Zod 3.25** - Runtime schema validation
- **Fuse.js 7.1** - Fuzzy search engine
- **React Virtuoso 4.12** - Efficient list virtualization
- **Web Workers** - Background JSON parsing

### Visualization
- **React Calendar Heatmap** - Timeline visualization
- **React Player** - Media playback
- **Yet Another React Lightbox** - Image gallery

### Routing & State
- **React Router DOM 7.6** - Client-side routing
- **React Context** - Global state management

## Architecture

The application follows a component-based architecture with clear separation of concerns:

```
src/
├── components/          # Reusable UI components
├── pages/              # Route-level components
├── hooks/              # Custom React hooks
├── context/            # Global state management
├── workers/            # Web Workers for background processing
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── styles/             # Global styles and themes
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern browser with File System Access API support (Chrome/Edge 86+)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd messenger-archive-viewer

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run unit tests
npm run test:ui      # Test UI
npm run cypress      # E2E tests
npm run lint         # Lint code
npm run format       # Format code
```

## Usage

1. **Download Your Data**: Export your Facebook Messenger data from Facebook
2. **Extract Archive**: Unzip the downloaded archive
3. **Open Application**: Navigate to the running app in your browser
4. **Select Folder**: Use the folder picker to select your messages directory
5. **Browse & Search**: Explore conversations, search messages, view timeline

## Data Processing Flow

1. **Folder Selection**: User selects the `messages` directory from their Facebook archive
2. **Directory Scanning**: App scans for conversation folders and `message_*.json` files
3. **Web Worker Parsing**: JSON files are parsed in background workers for performance
4. **Index Building**: Search indexes and timeline data are built from parsed messages
5. **UI Rendering**: Conversations are displayed with virtualized rendering for performance

## File Structure Documentation

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architectural documentation.
See [API.md](./API.md) for component API reference.
See [SETUP.md](./SETUP.md) for detailed setup and configuration.
See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Contributing

This project uses:
- ESLint + Prettier for code formatting
- Vitest for unit testing
- Cypress for E2E testing
- TypeScript strict mode
- Conventional commit messages

## Privacy & Security

- **No Data Upload**: All processing happens locally in your browser
- **No External Dependencies**: Core functionality works offline
- **Optional API**: OpenRouter integration is opt-in and configurable
- **Local Storage**: Only settings and API keys are stored locally

## Browser Compatibility

- Chrome/Edge 86+: Full support with File System Access API
- Firefox: Limited support (file input fallback)
- Safari: Limited support (file input fallback)

## License

[Add license information]

## Support

For issues and feature requests, please use the project's issue tracker.