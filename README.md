# Facebook Messenger Archive Viewer

A privacy-focused, client-side web application for browsing and searching your Facebook Messenger data export. All processing happens in your browser - no data is ever sent to any server.

## Features

- 📁 **Local Processing**: Your data never leaves your browser
- 🔍 **Fuzzy Search**: Search through messages with keyword matching
- 📊 **Timeline Visualization**: See message activity over time with an interactive heatmap
- 🖼️ **Advanced Media Support**: 
  - Photos with lightbox gallery and click-to-expand
  - Videos with responsive inline player and fullscreen lightbox
  - Audio files with full playback controls
  - GIFs, stickers, and file attachments with download
- 😊 **Reaction Display**: Grouped emoji reactions with hover tooltips showing all reactors
- 🌍 **International Support**: Automatic correction of Facebook's character encoding issues (mojibake)
- ⚡ **Fast Performance**: Virtualized lists and streaming JSON parsing for large archives
- 🎨 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🔐 **Future AI Search**: Optional OpenRouter integration for semantic search (coming soon)

## Getting Started

### Prerequisites

- A modern browser with File System Access API support (Chrome, Edge, or similar)
- Your Facebook data export (specifically the `messages` folder)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/messenger-archive-viewer.git
cd messenger-archive-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. Click "Select Messages Folder" and navigate to your Facebook data export
2. Select the `messages` folder (containing `inbox` and/or `e2ee_cutover` subfolders)
3. Browse your conversations from the list
4. Click on any conversation to view messages
5. Use the search bar to find specific messages
6. Toggle the timeline view to see message activity over time

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests with Vitest
- `npm run cypress` - Open Cypress for E2E testing

### Tech Stack

- **React** + **TypeScript** - UI framework and type safety
- **Vite** - Build tool and dev server
- **Chakra UI** - Component library
- **React Virtuoso** - List virtualization for performance
- **Fuse.js** - Fuzzy search functionality
- **React Player** - Media playback for videos and audio
- **Yet Another React Lightbox** - Photo/video gallery with Video plugin
- **Web Workers** - Background JSON parsing and encoding fixes
- **File System Access API** - Local file access without uploads
- **Zod** - Runtime type validation and schema enforcement

## Privacy

This application is designed with privacy as the top priority:
- All data processing happens locally in your browser
- No data is ever sent to any server
- No analytics or tracking
- Optional API keys are stored only in your browser's localStorage
- You have complete control over your data

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details