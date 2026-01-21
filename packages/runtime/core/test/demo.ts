/**
 * ObjectQL Runtime Core - Example Usage
 * 
 * This example demonstrates the key features:
 * 1. Plugin dependency resolution
 * 2. Query pipeline with waterfall processing
 * 3. Runtime lifecycle management
 */

import { createRuntime } from '../src/index';
import type { BasePlugin, QueryProcessorPlugin } from '@objectql/types';

// Example 1: Basic plugin with dependencies
const loggerPlugin: BasePlugin = {
    metadata: {
        name: 'logger',
        version: '1.0.0',
        type: 'extension'
    },
    async setup(runtime) {
        console.log('[Logger] Plugin initialized');
    }
};

const cachePlugin: BasePlugin = {
    metadata: {
        name: 'cache',
        version: '1.0.0',
        type: 'extension',
        dependencies: ['logger'] // Depends on logger
    },
    async setup(runtime) {
        console.log('[Cache] Plugin initialized (after logger)');
    }
};

// Example 2: Query processor plugin
const securityPlugin: QueryProcessorPlugin = {
    metadata: {
        name: 'security',
        version: '1.0.0',
        type: 'query_processor',
        dependencies: ['logger']
    },
    async setup(runtime) {
        console.log('[Security] Plugin initialized');
    },
    async validateQuery(query, context) {
        // Validate user has permission
        if (!context.user) {
            throw new Error('Authentication required');
        }
    },
    async beforeQuery(query, context) {
        console.log(`[Security] User ${context.user?.id} executing query`);
        // Add tenant filter automatically
        return {
            ...query,
            filters: [
                ...(query.filters || []),
                ['tenant_id', '=', context.user?.tenant_id]
            ]
        };
    }
};

// Example 3: Demo runtime usage
async function demo() {
    console.log('=== ObjectQL Runtime Core Demo ===\n');

    // Create runtime with plugins
    const runtime = createRuntime({
        plugins: [
            securityPlugin, // Registered in any order
            cachePlugin,
            loggerPlugin
        ]
    });

    // Set query executor (mock)
    runtime.setQueryExecutor(async (objectName, query) => {
        console.log(`[Driver] Executing query on ${objectName}:`, query);
        return [
            { id: 1, name: 'Project 1', tenant_id: 'tenant-1' }
        ];
    });

    // Initialize (plugins will be setup in dependency order)
    console.log('\n1. Initializing runtime...');
    await runtime.init();

    // Execute query through pipeline
    console.log('\n2. Executing query through pipeline...');
    const results = await runtime.query('project', {
        fields: ['id', 'name'],
        filters: [['status', '=', 'active']]
    }, {
        user: {
            id: 'user-123',
            tenant_id: 'tenant-1'
        }
    });

    console.log('\n3. Results:', results);

    // Shutdown
    console.log('\n4. Shutting down runtime...');
    await runtime.shutdown();

    console.log('\n=== Demo Complete ===');
}

// Run demo if this file is executed directly
if (require.main === module) {
    demo().catch(console.error);
}

export { demo };
