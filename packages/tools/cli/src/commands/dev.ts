import { serve } from './serve';
import chalk from 'chalk';

/**
 * Start development server with hot reload
 * This is an enhanced version of the serve command for development workflow
 */
export async function dev(options: { 
    port: number; 
    dir: string;
    config?: string;
    modules?: string;
    watch?: boolean;
}) {
    console.log(chalk.cyan('🚀 Starting ObjectQL Development Server...\n'));
    
    // For now, delegate to serve command
    // In future, can add file watching and auto-reload
    await serve({ 
        port: options.port, 
        dir: options.dir,
        config: options.config,
        modules: options.modules
    });
    
    if (options.watch !== false) {
        console.log(chalk.yellow('\n👀 Watching for file changes... (Not yet implemented)'));
        console.log(chalk.gray('   Tip: Use --no-watch to disable file watching'));
    }
}
