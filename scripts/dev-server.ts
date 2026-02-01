import { ObjectKernel } from '@objectstack/core';
import config from '../objectql.config';

async function main() {
    console.log('🚀 Starting ObjectStack Custom Dev Server...');
    
    const kernel = new ObjectKernel({});

    if (config.plugins) {
        for (const plugin of config.plugins) {
            console.log(`🔌 Registering plugin: ${plugin.name}`);
            kernel.use(plugin);
        }
    }

    try {
        await kernel.bootstrap();
        console.log('✅ Server started successfully!');
    } catch (err) {
        console.error('❌ Failed to start server:', err);
        process.exit(1);
    }
}

main();
