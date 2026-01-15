import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import { ObjectLoader, loadModules } from '@objectql/platform-node';
import { createNodeHandler } from '@objectql/server';
import { createServer } from 'http';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';

interface StartOptions {
    port: number;
    dir: string;
    config?: string;
    modules?: string;
}

// Flexible config type that handles both ObjectQLConfig and custom config formats
interface LoadedConfig {
    datasources?: Record<string, any>;
    datasource?: Record<string, any>;
    [key: string]: any;
}

/**
 * Start production server
 * Loads configuration from objectql.config.ts/js if available
 */
export async function start(options: StartOptions) {
    console.log(chalk.blue('Starting ObjectQL Production Server...'));
    
    const rootDir = path.resolve(process.cwd(), options.dir);
    console.log(chalk.gray(`Loading schema from: ${rootDir}`));

    // Try to load configuration
    let config: LoadedConfig | null = null;
    const configPath = options.config || path.join(process.cwd(), 'objectql.config.ts');
    
    if (fs.existsSync(configPath)) {
        try {
            console.log(chalk.gray(`Loading config from: ${configPath}`));
            // Use require for .js files or ts-node for .ts files
            if (configPath.endsWith('.ts')) {
                require('ts-node/register');
            }
            const loadedModule = require(configPath);
            // Handle both default export and direct export
            config = loadedModule.default || loadedModule;
        } catch (e: any) {
            console.warn(chalk.yellow(`⚠️  Failed to load config: ${e.message}`));
        }
    }

    // Process modules override
    if (options.modules) {
        const moduleList = options.modules.split(',').map(p => p.trim());
        if (!config) config = {};
        config.modules = moduleList;
        console.log(chalk.yellow(`⚠️ Overriding modules: ${moduleList.join(', ')}`));
    }

    // Initialize datasource from config or use default SQLite
    // Note: Config files may use 'datasource' (singular) while ObjectQLConfig uses 'datasources' (plural)
    const datasourceConfig = config?.datasources?.default || config?.datasource?.default || {
        client: 'sqlite3',
        connection: {
            filename: process.env.DATABASE_FILE || './objectql.db'
        },
        useNullAsDefault: true
    };

    const driver = new SqlDriver(datasourceConfig);
    const app = new ObjectQL({
        datasources: { default: driver }
    });

    // Load Schema
    try {
        const loader = new ObjectLoader(app.metadata);
        
        // Load modules first (if any)
        // Backwards compatibility for presets
        const modulesToLoad = config?.modules || config?.presets;
        if (modulesToLoad) {
            await loadModules(loader, modulesToLoad);
        }

        // Load project source
        loader.load(rootDir);
        
        await app.init();
        console.log(chalk.green('✅ Schema loaded successfully.'));
    } catch (e: any) {
        console.error(chalk.red('❌ Failed to load schema:'), e.message);
        process.exit(1);
    }

    // Create Handler
    const handler = createNodeHandler(app);

    // Start Server
    const server = createServer(async (req, res) => {
        await handler(req, res);
    });
    
    server.listen(options.port, () => {
        console.log(chalk.green(`\n✅ Server started in production mode`));
        console.log(chalk.green(`🚀 API endpoint: http://localhost:${options.port}`));
        console.log(chalk.blue(`📖 OpenAPI Spec: http://localhost:${options.port}/openapi.json`));
        
        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            console.log(chalk.yellow('\n⚠️  SIGTERM received, shutting down gracefully...'));
            server.close(() => {
                console.log(chalk.green('✅ Server closed'));
                process.exit(0);
            });
        });
    });
}
