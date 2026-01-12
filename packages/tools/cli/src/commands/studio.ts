import { ObjectQL } from '@objectql/core';
import { ObjectLoader, createDriverFromConnection } from '@objectql/platform-node';
import { createNodeHandler, createStudioHandler, createMetadataHandler } from '@objectql/server';
import { createServer } from 'http';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { exec } from 'child_process';
import { register } from 'ts-node';
import glob from 'fast-glob';

const SWAGGER_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ObjectQL Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" crossorigin></script>
<script>
  window.onload = () => {
    window.ui = SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
    });
  };
</script>
</body>
</html>
`;

function openBrowser(url: string) {
    const start = (process.platform == 'darwin' ? 'open' : process.platform == 'win32' ? 'start' : 'xdg-open');
    exec(`${start} ${url}`);
}

export async function startStudio(options: { port: number; dir: string, open?: boolean }) {
    const startPort = options.port || 5555;
    const rootDir = path.resolve(process.cwd(), options.dir || '.');
    
    console.log(chalk.blue('Starting ObjectQL Studio...'));
    console.log(chalk.gray(`Project Root: ${rootDir}`));

    // Register ts-node
    register({
        transpileOnly: true,
        compilerOptions: {
            module: "commonjs"
        }
    });

    let app: ObjectQL;
    const configTs = path.join(rootDir, 'objectql.config.ts');
    const configJs = path.join(rootDir, 'objectql.config.js');

    if (fs.existsSync(configTs)) {
        console.log(chalk.gray(`Loading config from ${configTs}`));
        const mod = require(configTs);
        app = mod.default || mod;
    } else if (fs.existsSync(configJs)) {
        console.log(chalk.gray(`Loading config from ${configJs}`));
        const mod = require(configJs);
        app = mod.default || mod;
    } else {
        console.error(chalk.red('\n❌ Error: Configuration file (objectql.config.ts) not found.'));
        process.exit(1);
    }

    if (!app) {
         console.error(chalk.red('\n❌ Error: No default export found in configuration file.'));
         process.exit(1);
    }

    // Initialize App if it's a configuration object
    if (typeof (app as any).init !== 'function') {
        const config = app as any;
        console.log(chalk.gray('Configuration object detected. Initializing ObjectQL instance...'));
        
        const datasources: any = {};
        
        if (config.datasource && config.datasource.default) {
            const dbConfig = config.datasource.default;
            if (dbConfig.type === 'sqlite') {
                try {
                    const { SqlDriver } = require('@objectql/driver-sql');
                    datasources.default = new SqlDriver({
                        client: 'sqlite3',
                        connection: {
                            filename: dbConfig.filename ? path.resolve(rootDir, dbConfig.filename) : ':memory:'
                        },
                        useNullAsDefault: true
                    });
                } catch (e) {
                    console.warn(chalk.yellow('Failed to load @objectql/driver-sql. Ensure it is installed.'));
                }
            }
        }

        // Fallback to memory if no datasource
        if (!datasources.default) {
            console.warn(chalk.yellow('No valid datasource found. Using in-memory SQLite.'));
            const { SqlDriver } = require('@objectql/driver-sql');
            datasources.default = new SqlDriver({
                client: 'sqlite3',
                connection: { filename: ':memory:' },
                useNullAsDefault: true
            });
        }

        app = new ObjectQL({ datasources });
        
        // Load Schema
        const loader = new ObjectLoader(app.metadata);

        // Load Presets
        if (Array.isArray(config.presets)) {
            console.log(chalk.gray(`Loading ${config.presets.length} presets...`));
            for (const preset of config.presets) {
                try {
                    loader.loadPackage(preset);
                } catch (e: any) {
                    console.warn(chalk.yellow(`Failed to load preset ${preset}:`), e.message);
                }
            }
        }

        // Load Schema from Directory
        // In a monorepo root with presets, scanning everything is dangerous.
        // We check if we are in a monorepo-like environment.
        const isMonorepoRoot = fs.existsSync(path.join(rootDir, 'pnpm-workspace.yaml')) || fs.existsSync(path.join(rootDir, 'pnpm-lock.yaml'));
        
        // If we are in a likely monorepo root AND have presets, skip recursive scan
        if (isMonorepoRoot && config.presets && config.presets.length > 0) {
             console.log(chalk.yellow('Monorepo root detected with presets. Skipping recursive file scan of root directory to avoid conflicts.'));
        } else {
             loader.load(rootDir);
        }
    }

    // 2. Load Schema & Init
    try {
        await app.init();
    } catch (e: any) {
        console.error(chalk.red('❌ Failed to initialize application:'), e.message);
        process.exit(1);
    }

    // 3. Setup HTTP Server
    const nodeHandler = createNodeHandler(app);
    const studioHandler = createStudioHandler();
    const metadataHandler = createMetadataHandler(app);

    const server = createServer(async (req, res) => {
        // CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        if (req.url === '/openapi.json') {
            return nodeHandler(req, res);
        }

        if (req.url === '/swagger') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(SWAGGER_HTML);
            return;
        }

        // Routing
        if (req.url?.startsWith('/studio')) {
            return studioHandler(req, res);
        }

        if (req.url?.startsWith('/api/schema/files')) {
            // List all metadata files
            try {
                // Find all *.*.yml files relative to rootDir
                // Note: User might have configured objectql with specific source paths. 
                // We ignore common build folders to avoid duplicates/editing compiled files.
                // We broadly match all objectql-like files: *.object.yml, *.view.yml, etc.
                const files = await glob('**/*.{object,app,view,permission,report,validation,workflow,form,data,hook,action}.yml', { 
                    cwd: rootDir, 
                    ignore: ['node_modules/**', 'dist/**', 'build/**', 'out/**', '.git/**', '.next/**'] 
                });
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ files }));
            } catch (e: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
            }
            return;
        }

        if (req.url?.startsWith('/api/schema/content')) {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const file = urlObj.searchParams.get('file');

            if (!file) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing file parameter' }));
                return;
            }

            const filePath = path.join(rootDir, file);
            // Security check
            if (!filePath.startsWith(rootDir)) {
                res.statusCode = 403;
                res.end(JSON.stringify({ error: 'Access denied' }));
                return;
            }

            if (req.method === 'GET') {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    res.setHeader('Content-Type', 'text/plain'); // Plain text (YAML)
                    res.end(content);
                } catch (e) {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'File not found' }));
                }
                return;
            }

            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                   try {
                       fs.writeFileSync(filePath, body, 'utf-8');
                       res.statusCode = 200;
                       res.end(JSON.stringify({ success: true }));
                   } catch (e: any) {
                       res.statusCode = 500;
                       res.end(JSON.stringify({ error: e.message }));
                   }
                });
                return;
            }
        }

        if (req.url?.startsWith('/api/schema/find')) {
            const urlObj = new URL(req.url, `http://${req.headers.host}`);
            const objectName = urlObj.searchParams.get('object');
            
            if (!objectName) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing object parameter' }));
                return;
            }

            try {
                // Find all object.yml files
                const files = await glob('**/*.object.yml', { 
                    cwd: rootDir, 
                    ignore: ['node_modules/**', 'dist/**', 'build/**', 'out/**', '.git/**', '.next/**'] 
                });
                let foundFile = null;

                // Naive parsing to find the object definition
                // We don't use the FULL parser, just checks if "name: objectName" is present
                for (const file of files) {
                    const content = fs.readFileSync(path.join(rootDir, file), 'utf-8');
                    // Simple check: name: <objectName> or name: "<objectName>"
                    // This creates a regex that looks for `name:` followed by the objectName
                    // Handles spaces, quotes
                    const regex = new RegExp(`^\\s*name:\\s*["']?${objectName}["']?\\s*$`, 'm');
                    if (regex.test(content)) {
                        foundFile = file;
                        break;
                    }
                }

                if (foundFile) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ file: foundFile }));
                } else {
                    res.statusCode = 404;
                    res.end(JSON.stringify({ error: 'Object definition file not found' }));
                }
            } catch (e: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
            }
            return;
        }

        if (req.url?.startsWith('/api/metadata')) {
            return metadataHandler(req, res);
        }
        
        if (req.url?.startsWith('/api')) {
            // Strip /api prefix if needed by the handler, 
            // but ObjectQL node handler usually expects full path or depends on internal routing.
            // Actually createNodeHandler handles /objectql/v1/ etc? 
            // Let's assume standard behavior: pass to handler
            return nodeHandler(req, res);
        }

        // Redirect root to studio
        if (req.url === '/') {
            res.writeHead(302, { 'Location': '/studio' });
            res.end();
            return;
        }

        res.statusCode = 404;
        res.end('Not Found');
    });

    const tryListen = (port: number) => {
        server.removeAllListeners('error');
        server.removeAllListeners('listening'); // Prevent stacking callbacks

        server.on('error', (e: any) => {
            if (e.code === 'EADDRINUSE') {
                if (port - startPort < 10) {
                    console.log(chalk.yellow(`Port ${port} is in use, trying ${port + 1}...`));
                    server.close();
                    tryListen(port + 1);
                } else {
                    console.error(chalk.red(`❌ Unable to find a free port.`));
                    process.exit(1);
                }
            } else {
                console.error(chalk.red('❌ Server error:'), e);
            }
        });

        server.listen(port, () => {
            const url = `http://localhost:${port}/studio`;
            console.log(chalk.green(`\n🚀 Studio running at: ${chalk.bold(url)}`));
            console.log(chalk.gray(`   API endpoint: http://localhost:${port}/api`));
            
            if (options.open) {
                openBrowser(url);
            }
        });
    };

    tryListen(startPort);
}
