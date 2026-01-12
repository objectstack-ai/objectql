import { IncomingMessage, ServerResponse } from 'http';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Creates a handler to serve the Studio UI static files.
 */
export function createStudioHandler() {
    let distPath: string | null = null;

    // 1. Try to resolve from installed package (Standard way)
    try {
        const studioPkg = require.resolve('@objectql/studio/package.json');
        const candidate = path.join(path.dirname(studioPkg), 'dist');
        if (fs.existsSync(candidate)) {
            distPath = candidate;
        }
    } catch (e) {
        // @objectql/studio might not be installed
    }

    // 2. Fallback for local development (Monorepo)
    if (!distPath) {
        const possiblePaths = [
            path.join(__dirname, '../../studio/dist'),
            path.join(process.cwd(), 'packages/studio/dist'),
        ];
        
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                distPath = p;
                break;
            }
        }
    }
    
    return async (req: IncomingMessage, res: ServerResponse) => {
        if (!distPath) {
            // Return placeholder page if studio is not built
            const html = getPlaceholderPage();
            res.setHeader('Content-Type', 'text/html');
            res.statusCode = 200;
            res.end(html);
            return;
        }
        
        // Parse the URL and remove /studio prefix
        let urlPath = (req.url || '').replace(/^\/studio/, '') || '/';
        
        // Default to index.html for SPA routing
        if (urlPath === '/' || !urlPath.includes('.')) {
            urlPath = '/index.html';
        }
        
        const filePath = path.join(distPath, urlPath);
        
        // Security check: ensure the file is within distPath
        if (!filePath.startsWith(distPath)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
        }
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            // For SPA, return index.html for any non-existent routes
            const indexPath = path.join(distPath, 'index.html');
            if (fs.existsSync(indexPath)) {
                const content = fs.readFileSync(indexPath);
                res.setHeader('Content-Type', 'text/html');
                res.statusCode = 200;
                res.end(content);
                return;
            }
            
            res.statusCode = 404;
            res.end('Not Found');
            return;
        }
        
        // Read and serve the file
        const content = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        const contentType = getContentType(ext);
        
        res.setHeader('Content-Type', contentType);
        res.statusCode = 200;
        res.end(content);
    };
}

function getContentType(ext: string): string {
    const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
    };
    return types[ext] || 'application/octet-stream';
}

function getPlaceholderPage(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ObjectQL Studio</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
        }
        h1 { font-size: 3rem; margin-bottom: 1rem; }
        p { font-size: 1.25rem; opacity: 0.9; line-height: 1.6; }
        .info {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 8px;
            margin-top: 2rem;
            backdrop-filter: blur(10px);
        }
        code {
            background: rgba(0, 0, 0, 0.2);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ObjectQL Studio</h1>
        <p>Web-based admin studio for database management</p>
        <div class="info">
            <p style="margin-bottom: 1rem;">
                The studio is available but needs to be built separately.
            </p>
            <p style="font-size: 1rem;">
                To use the full studio UI, run:<br>
                <code>cd packages/studio && pnpm run build</code>
            </p>
        </div>
    </div>
</body>
</html>`;
}
