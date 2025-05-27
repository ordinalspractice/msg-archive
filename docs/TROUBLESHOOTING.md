# Troubleshooting Guide

This guide covers common issues, error messages, and solutions for the Facebook Messenger Archive Viewer application.

## Table of Contents

- [Common Issues](#common-issues)
- [Browser Compatibility](#browser-compatibility)
- [File System Access](#file-system-access)
- [Performance Issues](#performance-issues)
- [Development Problems](#development-problems)
- [Build and Deployment](#build-and-deployment)
- [Error Messages](#error-messages)
- [Debug Mode](#debug-mode)

## Common Issues

### Application Won't Start

**Symptom**: Application fails to load or shows white screen

**Possible Causes & Solutions**:

1. **Node.js Version Mismatch**
   ```bash
   # Check Node.js version
   node --version
   
   # Should be 18.0.0 or higher
   # Update if necessary
   nvm install 18
   nvm use 18
   ```

2. **Dependency Issues**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   
   # Or with npm cache clean
   npm cache clean --force
   npm install
   ```

3. **Port Already in Use**
   ```bash
   # Try different port
   npm run dev -- --port 3001
   
   # Or kill process using port 5173
   lsof -ti:5173 | xargs kill -9
   ```

### Folder Selection Not Working

**Symptom**: Folder picker doesn't appear or fails to select directory

**Solutions**:

1. **Browser Compatibility**
   - Use Chrome 86+ or Edge 86+ for best experience
   - Firefox/Safari will show file input fallback

2. **File System Access API Not Available**
   ```typescript
   // Check in browser console
   console.log('File System Access API supported:', 'showDirectoryPicker' in window);
   ```

3. **Permissions Issues**
   - Ensure browser has file system permissions
   - Check site settings in browser
   - Try incognito/private mode

### Messages Not Loading

**Symptom**: Conversations appear but messages don't load

**Diagnostic Steps**:

1. **Check Console for Errors**
   ```javascript
   // Open browser dev tools (F12)
   // Look for errors in Console tab
   ```

2. **Verify Facebook Export Structure**
   ```
   messages/
   ├── inbox/
   │   ├── conversation_name/
   │   │   ├── message_1.json
   │   │   ├── message_2.json
   │   │   └── ...
   │   └── ...
   └── ...
   ```

3. **JSON Format Issues**
   - Facebook exports can have malformed JSON
   - Check specific message files manually
   - Look for truncated or corrupted files

### Character Encoding Issues

**Symptom**: Non-English characters appear corrupted (e.g., Polish "ł" shows as "Å")

**Cause**: Facebook exports contain "mojibake" - UTF-8 text that was incorrectly interpreted as windows-1252 and then stored in UTF-8 JSON files

**Examples of corrupted characters**:
- `włosy` → `wÅosy` (hair)
- `brązowe` → `brÄzowe` (brown)
- `Kupiłam` → `KupiÅam` (I bought)
- `ł` → `Å`
- `ą` → `Ä` 
- `ę` → `Ä`
- `ó` → `Ã³`
- `ż` → `Å¼`

**Solutions**:

1. **Automatic Mojibake Fix (Built-in)**
   - The app automatically fixes Facebook's mojibake using `decodeURIComponent(escape(text))`
   - Applied to entire file content before JSON parsing
   - Additional fixes applied to individual fields (names, content, titles)
   - No user action required - works automatically

2. **How the Fix Works**
   ```typescript
   // Example: "Å¼" (corrupted "ż") gets fixed
   escape("Å¼")           // → "%C5%BC" (percent-encoded bytes)
   decodeURIComponent("%C5%BC")  // → "ż" (proper UTF-8 decoding)
   ```

3. **Verification**
   - Check browser console for `[encoding] Fixed mojibake` messages
   - Polish characters should display correctly in conversations
   - Test function available: `testEncodingFix()` in browser console

4. **If Issues Persist**
   - Clear browser cache and reload
   - Check console for encoding errors
   - Report specific character combinations that aren't fixed

### Search Not Working

**Symptom**: Search bar appears but returns no results

**Solutions**:

1. **Case Sensitivity**
   - Search is case-insensitive by default
   - Try different search terms

2. **Search Index Not Built**
   - Wait for messages to fully load
   - Check browser console for indexing errors

3. **Fuse.js Configuration**
   ```typescript
   // Current search settings
   const fuseOptions = {
     keys: ['content', 'sender_name'],
     threshold: 0.4, // Lower = more strict
     includeScore: true,
   };
   ```

## Browser Compatibility

### Chrome/Edge Issues

**Modern Features Required**:
- File System Access API (Chrome 86+)
- Web Workers (universal)
- ES Modules (universal)

**Common Chrome Issues**:

1. **CORS Errors in Development**
   ```bash
   # Start Chrome with disabled security (development only)
   google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev"
   ```

2. **Memory Limits**
   - Large archives may hit memory limits
   - Monitor in Chrome DevTools > Memory tab
   - Close other tabs to free memory

### Firefox Compatibility

**Limitations**:
- No File System Access API support
- Falls back to file input with `webkitdirectory`
- May have performance differences

**Firefox-Specific Issues**:

1. **File Input Fallback**
   ```html
   <!-- Fallback UI appears -->
   <input type="file" webkitdirectory multiple />
   ```

2. **Worker Module Loading**
   - May have issues with ES modules in workers
   - Check console for module loading errors

### Safari Compatibility

**Limitations**:
- Limited File System Access API support
- Some CSS features may differ
- WebKit-specific behaviors

**Safari Solutions**:
1. Enable "Develop" menu features
2. Check Web Inspector for compatibility warnings
3. Test with latest Safari version

## File System Access

### Permission Denied Errors

**Error**: "NotAllowedError: The request is not allowed"

**Solutions**:

1. **Browser Settings**
   - Check site permissions in browser settings
   - Allow file system access for the site
   - Clear site data and try again

2. **User Gesture Required**
   - Ensure folder selection is triggered by user click
   - Not programmatic or automatic

3. **Secure Context Required**
   - Must be served over HTTPS or localhost
   - File:// protocol may not work

### Invalid Directory Structure

**Error**: Messages directory not found or invalid

**Solutions**:

1. **Verify Facebook Export**
   ```
   Expected structure:
   your-facebook-archive/
   ├── messages/
   │   ├── inbox/
   │   ├── message_requests/
   │   └── archived_threads/
   └── other_folders/
   ```

2. **Select Correct Folder**
   - Select the `messages` folder specifically
   - Not the root archive folder
   - Not individual conversation folders

3. **Check for Empty Directories**
   - Some exports may have empty conversation folders
   - Verify conversations contain `message_*.json` files

## Performance Issues

### Slow Loading Times

**Symptoms**: Long delays when loading conversations

**Solutions**:

1. **Large Archive Optimization**
   ```typescript
   // Increase virtual scrolling overscan
   <Virtuoso overscan={400} /> // Default: 200
   ```

2. **Memory Management**
   - Close unused browser tabs
   - Restart browser periodically
   - Monitor memory usage in DevTools

3. **Worker Performance**
   ```typescript
   // Check worker status
   console.log('Worker supported:', typeof Worker !== 'undefined');
   ```

### Browser Freezing

**Symptoms**: UI becomes unresponsive during processing

**Solutions**:

1. **Enable Debug Logging**
   ```bash
   VITE_DEBUG=true npm run dev
   ```

2. **Reduce Concurrent Processing**
   - Process conversations one at a time
   - Implement queue system for large archives

3. **Browser Resource Limits**
   - Increase browser memory limits if possible
   - Use browser flags for development:
   ```bash
   google-chrome --max-old-space-size=8192
   ```

### Virtual Scrolling Issues

**Symptoms**: Jerky scrolling or missing messages

**Solutions**:

1. **Virtuoso Configuration**
   ```typescript
   <Virtuoso
     data={messages}
     overscan={200}
     fixedItemSize={50} // If items have consistent height
     followOutput="smooth"
   />
   ```

2. **Item Size Calculation**
   - Ensure consistent item heights when possible
   - Avoid dynamic height changes during scroll

## Development Problems

### TypeScript Errors

**Common Issues**:

1. **Module Not Found**
   ```bash
   # Clear TypeScript cache
   rm -rf node_modules/.cache
   npx tsc --build --clean
   npm install
   ```

2. **Type Import Errors**
   ```typescript
   // Use type-only imports
   import type { Message } from '../types/messenger';
   import { Virtuoso } from 'react-virtuoso';
   import type { VirtuosoHandle } from 'react-virtuoso';
   ```

3. **Strict Type Checking**
   ```json
   // tsconfig.json adjustments for development
   {
     "compilerOptions": {
       "strict": true,
       "skipLibCheck": true // Temporary for third-party types
     }
   }
   ```

### ESLint Errors

**Common Fixes**:

1. **React Hooks Dependencies**
   ```typescript
   // Fix missing dependencies
   useEffect(() => {
     // effect logic
   }, [dependency1, dependency2]); // Add all dependencies
   ```

2. **Unused Variables**
   ```typescript
   // Prefix with underscore or remove
   const _unusedVar = value;
   // or
   const { used, ...rest } = object;
   ```

### Hot Reload Issues

**Symptoms**: Changes not reflected or full page refresh

**Solutions**:

1. **Vite Configuration**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     server: {
       hmr: {
         overlay: false // Disable error overlay if causing issues
       }
     }
   });
   ```

2. **File Watching**
   ```bash
   # Increase file watch limits (Linux/macOS)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

## Build and Deployment

### Build Failures

**Common Issues**:

1. **Memory Exhaustion**
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

2. **TypeScript Compilation Errors**
   ```bash
   # Check TypeScript separately
   npx tsc --noEmit
   ```

3. **Asset Size Warnings**
   ```typescript
   // vite.config.ts - Increase chunk size limit
   export default defineConfig({
     build: {
       chunkSizeWarningLimit: 1000,
       rollupOptions: {
         output: {
           manualChunks: {
             vendor: ['react', 'react-dom'],
             ui: ['@chakra-ui/react'],
           }
         }
       }
     }
   });
   ```

### Deployment Issues

1. **Static Hosting Configuration**
   ```html
   <!-- _redirects file for SPA routing -->
   /*    /index.html   200
   ```

2. **HTTPS Requirements**
   - File System Access API requires secure context
   - Ensure deployment uses HTTPS

3. **Base Path Issues**
   ```typescript
   // vite.config.ts for subdirectory deployment
   export default defineConfig({
     base: '/messenger-archive-viewer/',
   });
   ```

## Error Messages

### "VirtuosoHandle is not exported"

**Solution**: Import as type-only
```typescript
import { Virtuoso } from 'react-virtuoso';
import type { VirtuosoHandle } from 'react-virtuoso';
```

### "showDirectoryPicker is not a function"

**Cause**: Browser doesn't support File System Access API

**Solution**: 
```typescript
// Check support and provide fallback
if ('showDirectoryPicker' in window) {
  // Use modern API
} else {
  // Show file input fallback
}
```

### "Worker constructor: Failed to load"

**Cause**: Worker module loading issues

**Solutions**:
1. Check Vite worker configuration
2. Ensure worker file is in correct location
3. Verify ES module syntax in worker

### "Cannot read properties of undefined"

**Common in**: Message parsing or rendering

**Debug Steps**:
1. Enable debug logging
2. Check message data structure
3. Add null checks in components
4. Validate with Zod schemas

### "Memory allocation failed"

**Cause**: Large archive exceeding browser memory

**Solutions**:
1. Process smaller chunks
2. Implement pagination
3. Clear unused data
4. Use more efficient data structures

## Debug Mode

### Enabling Debug Logging

1. **Development**
   ```bash
   VITE_DEBUG=true npm run dev
   ```

2. **Browser Console**
   ```javascript
   // Manually enable in console
   localStorage.setItem('debug', 'true');
   location.reload();
   ```

### Debug Information

**Logged Events**:
- `FOLDER_SELECTED`: Directory handle information
- `THREAD_SCAN_START`: Beginning directory scan
- `THREAD_FOUND`: Each conversation discovered
- `PARSE_START`: Beginning message parsing
- `PARSE_PROGRESS`: Parsing progress updates
- `PARSE_COMPLETE`: Parsing finished
- `SEARCH_QUERY`: Search operations
- `SEARCH_RESULTS`: Search result counts

**Example Debug Output**:
```
[DEBUG] FOLDER_SELECTED { name: "messages", kind: "directory" }
[DEBUG] THREAD_SCAN_START { timestamp: 1699123456789 }
[DEBUG] THREAD_FOUND { path: "inbox/conversation_1", messageCount: 3 }
[DEBUG] PARSE_START { threadId: "conversation_1" }
[DEBUG] PARSE_PROGRESS { threadId: "conversation_1", progress: 50 }
```

### Performance Profiling

1. **React DevTools Profiler**
   - Install React DevTools browser extension
   - Use Profiler tab to identify slow components

2. **Browser Performance Tab**
   - Record performance during message loading
   - Identify bottlenecks in parsing or rendering

3. **Memory Monitoring**
   - Use Memory tab to check for leaks
   - Monitor heap usage during large operations

### Manual Debugging

**Useful Console Commands**:
```javascript
// Check current state
console.log('App state:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__);

// Inspect parsed threads
console.log('Threads:', JSON.stringify(threadData, null, 2));

// Check worker status
console.log('Worker support:', typeof Worker !== 'undefined');

// Validate message format
console.log('Valid message:', MessageSchema.safeParse(messageData));
```

## Getting Help

### Before Reporting Issues

1. Check this troubleshooting guide
2. Enable debug mode and review logs
3. Test in multiple browsers
4. Verify Facebook export integrity
5. Check browser console for errors

### Reporting Bugs

Include the following information:
- Browser version and OS
- Error messages from console
- Steps to reproduce
- Debug logs (if applicable)
- Archive size and structure
- Screenshots of error states

### Community Resources

- GitHub Issues: Report bugs and feature requests
- Documentation: Comprehensive guides and API reference
- Development Setup: Detailed setup instructions

### Professional Support

For enterprise or commercial support needs, consider:
- Code review and optimization
- Custom feature development
- Deployment assistance
- Performance tuning