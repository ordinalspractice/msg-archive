# Setup and Development Guide

This guide covers everything needed to set up, develop, and deploy the Facebook Messenger Archive Viewer application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Quality](#code-quality)
- [Testing](#testing)
- [Building for Production](#building-for-production)
- [Deployment](#deployment)
- [Environment Configuration](#environment-configuration)

## Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher (or yarn/pnpm equivalent)
- **Git**: For version control
- **Modern Browser**: Chrome 86+, Edge 86+, or Firefox 90+ for development

### Development Tools (Recommended)
- **VS Code** with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier - Code formatter
  - Auto Rename Tag
  - Bracket Pair Colorizer
  - GitLens

### Browser Requirements
- **File System Access API**: Chrome/Edge 86+ (required for optimal UX)
- **Web Workers**: All modern browsers (universal support)
- **ES Modules**: All modern browsers (universal support)

## Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd messenger-archive-viewer
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Using yarn
yarn install

# Using pnpm
pnpm install
```

### 3. Verify Installation
```bash
npm run dev
```

The application should start on `http://localhost:5173/`

## Development Environment

### Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Optional: Custom port
VITE_PORT=5173

# Optional: Enable debug logging
VITE_DEBUG=true

# Optional: OpenRouter API URL (future feature)
VITE_OPENROUTER_URL=https://openrouter.ai/api/v1
```

### VS Code Configuration
Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "css"
  }
}
```

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

## Project Structure

```
messenger-archive-viewer/
├── public/                 # Static assets
│   └── vite.svg           # Favicon
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ErrorBoundary.tsx
│   │   ├── FolderPicker.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageList.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Settings.tsx
│   │   └── TimelineHeatmap.tsx
│   ├── context/           # Global state management
│   │   └── AppContext.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── useMessageParser.ts
│   ├── pages/             # Route-level components
│   │   ├── ConversationList.tsx
│   │   └── ConversationView.tsx
│   ├── styles/            # Global styles
│   │   └── heatmap.css
│   ├── types/             # TypeScript definitions
│   │   ├── file-system.d.ts
│   │   └── messenger.ts
│   ├── utils/             # Utility functions
│   │   └── logger.ts
│   ├── workers/           # Web Workers
│   │   └── parser.worker.ts
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Application entry point
│   └── vite-env.d.ts      # Vite type definitions
├── cypress/               # E2E tests
│   ├── e2e/
│   ├── fixtures/
│   └── support/
├── docs/                  # Documentation
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SETUP.md
│   └── TROUBLESHOOTING.md
├── dist/                  # Build output (generated)
├── node_modules/          # Dependencies (generated)
├── .gitignore
├── eslint.config.js       # ESLint configuration
├── index.html             # HTML template
├── package.json           # Project metadata and dependencies
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── vitest.config.ts       # Test configuration
```

## Development Workflow

### Starting Development
```bash
# Start development server with hot reload
npm run dev

# Start with custom port
VITE_PORT=3000 npm run dev

# Start with debug logging
VITE_DEBUG=true npm run dev
```

### Code Formatting
```bash
# Check formatting
npm run format:check

# Apply formatting
npm run format

# Fix linting issues
npm run lint:fix
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### Commit Message Convention
Use conventional commits format:

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes
- refactor: Code refactoring
- test: Test changes
- chore: Build/config changes

Examples:
feat(search): add fuzzy search functionality
fix(parser): handle malformed JSON files
docs(readme): update installation instructions
```

## Code Quality

### ESLint Configuration
The project uses ESLint with TypeScript and React plugins:

```javascript
// eslint.config.js
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'prefer-const': 'error',
    },
  },
];
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### Code Review Checklist
- [ ] TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Tests pass
- [ ] Code formatted with Prettier
- [ ] No console.log statements in production code
- [ ] Proper error handling
- [ ] Accessibility considerations
- [ ] Performance implications reviewed

## Testing

### Unit Tests (Vitest)
```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Test Structure
```typescript
// src/components/__tests__/MessageBubble.test.tsx
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble';
import type { Message } from '../../types/messenger';

describe('MessageBubble', () => {
  const mockMessage: Message = {
    sender_name: 'Test User',
    timestamp_ms: Date.now(),
    content: 'Test message',
  };

  it('renders message content', () => {
    render(<MessageBubble message={mockMessage} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});
```

### E2E Tests (Cypress)
```bash
# Open Cypress UI
npm run cypress

# Run Cypress tests headlessly
npm run cypress:run
```

### Test Files Location
```
src/
├── components/
│   ├── __tests__/
│   │   ├── MessageBubble.test.tsx
│   │   └── SearchBar.test.tsx
│   └── ...
├── hooks/
│   ├── __tests__/
│   │   └── useMessageParser.test.ts
│   └── ...
└── test/
    ├── setup.ts
    └── utils.tsx
```

## Building for Production

### Build Process
```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Build Configuration
The build process:
1. TypeScript compilation
2. Vite bundling and optimization
3. Asset optimization
4. Code splitting
5. Source map generation

### Build Output
```
dist/
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── worker-[hash].js
├── index.html
└── vite.svg
```

### Performance Optimization
- **Tree Shaking**: Removes unused code
- **Code Splitting**: Lazy loading for routes
- **Asset Optimization**: Minification and compression
- **Source Maps**: Available for debugging

## Deployment

### Static Hosting
The application is a static site and can be deployed to:

#### Netlify
```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables (optional)
VITE_OPENROUTER_URL=https://openrouter.ai/api/v1
```

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configuration in vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

#### GitHub Pages
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### CDN Configuration
```bash
# Configure headers for optimal caching
/_headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate
```

## Environment Configuration

### Development vs Production
```typescript
// src/config/env.ts
export const config = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  debugLogging: import.meta.env.VITE_DEBUG === 'true',
  openRouterUrl: import.meta.env.VITE_OPENROUTER_URL || 'https://openrouter.ai/api/v1',
};
```

### Feature Flags
```typescript
// src/config/features.ts
export const features = {
  semanticSearch: false, // Future feature
  exportFunctionality: false, // Future feature
  advancedAnalytics: false, // Future feature
  cloudSync: false, // Future feature
};
```

### Debugging
```typescript
// src/utils/logger.ts
const logger = {
  debug: (event: string, data?: any) => {
    if (config.debugLogging) {
      console.log(`[DEBUG] ${event}`, data);
    }
  },
  // ... other methods
};
```

## Common Development Tasks

### Adding a New Component
1. Create component file in `src/components/`
2. Export from component file
3. Add TypeScript interfaces
4. Write unit tests
5. Update documentation

### Adding a New Page
1. Create page component in `src/pages/`
2. Add route in `App.tsx`
3. Update navigation
4. Add E2E tests

### Adding New Dependencies
```bash
# Production dependency
npm install package-name

# Development dependency
npm install --save-dev package-name

# Update package.json scripts if needed
```

### Debugging Issues
1. Check browser console for errors
2. Use React Developer Tools
3. Enable debug logging with `VITE_DEBUG=true`
4. Use Vite's built-in debugging features

### Performance Monitoring
```typescript
// Performance measurement
const start = performance.now();
// ... operation
const end = performance.now();
logger.debug('OPERATION_TIME', { duration: end - start });
```

## Troubleshooting

For common issues and solutions, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

## Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Chakra UI Documentation](https://chakra-ui.com/)
- [Testing Library Documentation](https://testing-library.com/)
- [Cypress Documentation](https://docs.cypress.io/)