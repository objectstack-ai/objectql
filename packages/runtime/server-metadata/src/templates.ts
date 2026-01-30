/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function getWelcomePageHtml(routes: { rpc: string; data: string; }) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>ObjectQL Server</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
        h1 { margin-bottom: 10px; }
        code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; }
        .card { border: 1px solid #e1e4e8; border-radius: 6px; padding: 24px; margin-top: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .status { color: #28a745; font-weight: 600; display: inline-flex; align-items: center; }
        .status::before { content: ""; display: inline-block; width: 10px; height: 10px; background: #28a745; border-radius: 50%; margin-right: 8px; }
        a { color: #0366d6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ul { list-style-type: none; padding: 0; }
        li { padding: 8px 0; border-bottom: 1px solid #f1f1f1; }
        li:last-child { border-bottom: none; }
    </style>
</head>
<body>
    <div style="margin-bottom: 20px;">
        <span class="status">Running</span>
    </div>
    <h1>ObjectQL Server</h1>
    <p>The server is operational and ready to accept requests.</p>
    
    <div class="card">
        <h3 style="margin-top: 0">API Endpoints</h3>
        <ul>
            <li><strong>JSON-RPC:</strong> <code>POST ${routes.rpc}</code></li>
            <li><strong>REST API:</strong> <code>GET ${routes.data}/:object</code></li>
            <li><strong>OpenAPI Spec:</strong> <a href="/openapi.json">/openapi.json</a></li>
        </ul>
    </div>

    <div class="card">
        <h3 style="margin-top: 0">Useful Links</h3>
        <ul>
            <li><a href="https://objectql.org/docs" target="_blank">Documentation</a></li>
            <li><a href="https://github.com/objectql/objectql" target="_blank">GitHub Repository</a></li>
        </ul>
    </div>
    
    <p style="margin-top: 40px; color: #666; font-size: 0.85em; text-align: center;">
        Powered by <strong>ObjectQL</strong>
    </p>
</body>
</html>`;
}
