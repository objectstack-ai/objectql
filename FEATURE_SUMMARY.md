# Browser-Based Development Playground - Feature Summary

## 🎯 Overview

This feature enables developers to browse, edit, and test ObjectQL projects directly in the browser, similar to shadcn's interactive documentation approach. No local IDE setup required!

## 🚀 What's New

### 1. Development API Handler (`@objectql/server`)

A new `createDevHandler()` function provides RESTful endpoints for file system operations:

```typescript
import { createDevHandler } from '@objectql/server';

const devHandler = createDevHandler({
    enabled: process.env.NODE_ENV === 'development', // Must be explicitly enabled
    baseDir: process.cwd()
});
```

**Endpoints:**
- `GET /api/dev/files` - List project files
- `GET /api/dev/files/:path` - Read file content
- `PUT /api/dev/files/:path` - Update file
- `POST /api/dev/files` - Create file
- `DELETE /api/dev/files/:path` - Delete file
- `GET /api/dev/metadata` - Get ObjectQL metadata

### 2. Browser-Based IDE

A complete web-based development environment (`examples/integrations/dev-playground`):

**Features:**
- 📁 **File Browser**: Tree view with folder navigation
- ✏️ **Code Editor**: Multi-tab editing with syntax highlighting
- 🧪 **API Playground**: Test CRUD operations interactively
- 💾 **Auto-save**: Keyboard shortcuts (Ctrl+S / Cmd+S)
- 🔄 **Live Reload**: Real-time file tree updates

## 🔒 Security

**Secure by Default:**
- ❌ Disabled unless explicitly enabled
- ✅ File operations restricted to `src/` directory
- ✅ File type whitelist (.yml, .ts, .js, .json, .md)
- ✅ Path traversal protection
- ✅ CORS configuration support

**Test Coverage:**
- 20 unit tests (all passing)
- CodeQL analysis: 0 vulnerabilities

## 📖 Use Cases

### 1. Remote Development
Work on ObjectQL projects from any device - Chromebooks, tablets, cloud IDEs.

### 2. Live Workshops
Teach ObjectQL with live code editing and immediate API testing.

### 3. Rapid Prototyping
Quickly iterate on object definitions and test them instantly.

### 4. Code Review
Review ObjectQL metadata files in a collaborative browser environment.

### 5. Documentation
Embed live, editable examples in documentation sites.

## 🎬 Getting Started

```bash
# Clone the example
cd examples/integrations/dev-playground

# Install dependencies
pnpm install

# Start the backend server (port 3000)
pnpm run server

# In another terminal, start the frontend (port 5173)
pnpm run dev

# Open http://localhost:5173 in your browser
```

## 📂 Project Structure

```
examples/integrations/dev-playground/
├── src/
│   └── objects/          # Sample ObjectQL definitions
│       ├── project.object.yml
│       └── task.object.yml
├── index.html            # Browser UI
├── server.ts             # Node.js backend
├── package.json
└── README.md             # Full documentation
```

## 🔧 Integration

Add to your existing ObjectQL project:

```typescript
import http from 'http';
import { createDevHandler, createRESTHandler } from '@objectql/server';
import { ObjectQL } from '@objectql/core';

const app = new ObjectQL({ /* ... */ });
const devHandler = createDevHandler({ enabled: true });
const restHandler = createRESTHandler(app);

const server = http.createServer(async (req, res) => {
    if (req.url?.startsWith('/api/dev/')) {
        await devHandler(req, res);
    } else if (req.url?.startsWith('/api/data/')) {
        await restHandler(req, res);
    }
});

server.listen(3000);
```

## 📊 Technical Details

### Files Changed
- `packages/runtime/server/src/dev-handler.ts` - New handler (600+ lines)
- `packages/runtime/server/src/index.ts` - Export dev handler
- `packages/runtime/server/test/dev-handler.test.ts` - Tests (300+ lines)
- `examples/integrations/dev-playground/` - Example app (800+ lines)
- `README.md` - Documentation updates

### Dependencies
- No new production dependencies
- Uses existing Node.js APIs (fs, path, http)
- Vite for frontend dev server (dev dependency)

## 🎨 UI Features

### File Browser
- Expandable/collapsible folders
- File type icons
- Real-time refresh
- Modified indicator

### Code Editor
- Multi-tab interface
- Syntax highlighting for YAML, TS, JSON
- Modified file indicators (•)
- Close tab functionality
- Auto-save on Ctrl+S

### API Playground
- Object selector (auto-populated)
- Operation selector (find, create, update, etc.)
- JSON argument editor
- Formatted response viewer
- Error handling with visual feedback

## 🌟 Future Enhancements

Potential additions:
- Monaco Editor integration for advanced editing
- Git integration (commit, push, pull)
- Multi-user collaboration
- Terminal emulator
- Database query builder
- Real-time validation feedback

## 📄 License

MIT - Same as ObjectQL

## 👥 Credits

Inspired by:
- shadcn/ui's interactive documentation
- VS Code's web-based editor
- CodeSandbox's online IDE

---

**Ready to ship! 🚀**
All tests passing, no security vulnerabilities, comprehensive documentation.
