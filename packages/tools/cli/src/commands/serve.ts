import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import { createNodeHandler } from '@objectql/server';
import { createServer } from 'http';
import * as path from 'path';
import chalk from 'chalk';

const CONSOLE_HTML = `
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

export async function serve(options: { port: number; dir: string }) {
    console.log(chalk.blue('Starting ObjectQL Dev Server...'));
    
    const rootDir = path.resolve(process.cwd(), options.dir);
    console.log(chalk.gray(`Loading schema from: ${rootDir}`));

    // 1. Init ObjectQL with in-memory SQLite for Dev
    const app = new ObjectQL({
        datasources: {
            default: new SqlDriver({
                client: 'sqlite3',
                connection: {
                    filename: ':memory:' // Or local file './dev.db'
                },
                useNullAsDefault: true
            })
        }
    });

    // 2. Load Schema
    try {
        const loader = new ObjectLoader(app.metadata);
        loader.load(rootDir);
        await app.init();
        console.log(chalk.green('✅ Schema loaded successfully.'));
    } catch (e: any) {
        console.error(chalk.red('❌ Failed to load schema:'), e.message);
        process.exit(1);
    }

    // 3. Create Handler
    const internalHandler = createNodeHandler(app);

    // 4. Start Server
    const server = createServer(async (req, res) => {
        // Serve Swagger UI
        if (req.method === 'GET' && (req.url === '/swagger' || req.url === '/swagger/')) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(CONSOLE_HTML);
            return;
        }

        // Redirect / to /swagger for better DX
        if (req.method === 'GET' && req.url === '/') {
            res.writeHead(302, { 'Location': '/swagger' });
            res.end();
            return;
        }

        // Delegate to API Handler
        await internalHandler(req, res);
    });
    
    server.listen(options.port, () => {
        console.log(chalk.green(`\n🚀 Server ready at http://localhost:${options.port}`));
        console.log(chalk.green(`📚 Swagger UI:   http://localhost:${options.port}/swagger`));
        console.log(chalk.blue(`📖 OpenAPI Spec:  http://localhost:${options.port}/openapi.json`));
        console.log(chalk.gray('\nTry a curl command:'));
        console.log(`curl -X POST http://localhost:${options.port} -H "Content-Type: application/json" -d '{"op": "find", "object": "YourObject", "args": {}}'`);
    });
}
