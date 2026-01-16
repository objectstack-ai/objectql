import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

interface InitOptions {
    template?: string;
    name?: string;
    dir?: string;
    skipInstall?: boolean;
    skipGit?: boolean;
}

const TEMPLATES = {
    'hello-world': 'hello-world',
    'starter': 'project-tracker'
};

export async function initProject(options: InitOptions) {
    const projectName = options.name || 'my-objectql-project';
    const targetDir = options.dir || path.join(process.cwd(), projectName);
    const template = (options.template || 'starter') as keyof typeof TEMPLATES;

    if (!TEMPLATES[template]) {
        console.error(chalk.red(`❌ Unknown template: ${template}`));
        console.log(chalk.gray(`Available templates: ${Object.keys(TEMPLATES).join(', ')}`));
        process.exit(1);
    }

    console.log(chalk.blue(`\n🚀 Initializing ObjectQL project: ${chalk.bold(projectName)}`));
    console.log(chalk.gray(`Template: ${template}`));
    console.log(chalk.gray(`Directory: ${targetDir}\n`));

    // Check if directory exists
    if (fs.existsSync(targetDir)) {
        console.error(chalk.red(`❌ Directory already exists: ${targetDir}`));
        process.exit(1);
    }

    // Create project directory
    fs.mkdirSync(targetDir, { recursive: true });

    try {
        // Copy embedded template
        const templateName = TEMPLATES[template];
        // Must resolve relative to the dist/commands folder structure
        const sourcePath = path.resolve(__dirname, '../../templates', templateName);

        if (!fs.existsSync(sourcePath)) {
            // Fallback for development (running directly from src)
            // If running via ts-node in dev, structure might be different
             throw new Error(`Template not found at ${sourcePath}. Please check your CLI installation.`);
        }

        console.log(chalk.cyan(`⬇️ Creating project from embedded template...`));
        await copyDirectory(sourcePath, targetDir, ['node_modules', 'dist', '.git']);
        console.log(chalk.green('✅ Template created successfully.'));

        // Update package.json with project name
        const pkgPath = path.join(targetDir, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            pkg.name = projectName;
            pkg.version = '0.1.0';
            
            // Note: Since we are using examples from the monorepo, 
            // they might have "workspace:*" protocols.
            // We should replace them with "latest" or a specific version for end users.
            const replaceWorkspaceVersion = (deps: Record<string, string>) => {
                for (const dep of Object.keys(deps)) {
                    if (deps[dep] === 'workspace:*') {
                        // For public release, this should match the current CLI version or latest
                        deps[dep] = 'latest'; 
                    }
                }
            };

            if (pkg.dependencies) replaceWorkspaceVersion(pkg.dependencies);
            if (pkg.devDependencies) replaceWorkspaceVersion(pkg.devDependencies); // Often peerDeps in examples

            // Make public for the user's new project
            delete pkg.private;
            // Reset repository field as it will be a new repo
            delete pkg.repository;

            fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
        }

        // Initialize git repository
        if (!options.skipGit) {
            try {
                console.log(chalk.gray('\nInitializing git repository...'));
                await execAsync('git init', { cwd: targetDir });
                
                // Create .gitignore if it doesn't exist
                const gitignorePath = path.join(targetDir, '.gitignore');
                if (!fs.existsSync(gitignorePath)) {
                    const gitignore = `node_modules/
dist/
*.log
.DS_Store
*.sqlite3
.env
.env.local
`;
                    fs.writeFileSync(gitignorePath, gitignore);
                }
                
                console.log(chalk.green('✓ Git repository initialized'));
            } catch (err) {
                console.log(chalk.yellow('⚠ Git initialization skipped (git not available)'));
            }
        }

        // Install dependencies
        if (!options.skipInstall) {
            console.log(chalk.gray('\nInstalling dependencies...'));
            console.log(chalk.gray('This might take a few minutes...\n'));
            
            try {
                // Try pnpm first, fall back to npm
                const hasNpm = await checkCommand('pnpm');
                const packageManager = hasNpm ? 'pnpm' : 'npm';
                
                await execAsync(`${packageManager} install`, { 
                    cwd: targetDir,
                    // Show output in real-time would be better, but this is simpler
                });
                console.log(chalk.green(`✓ Dependencies installed with ${packageManager}`));
            } catch (err: any) {
                console.log(chalk.yellow(`⚠ Failed to install dependencies: ${err.message}`));
                console.log(chalk.gray(`You can install them manually by running:`));
                console.log(chalk.gray(`  cd ${projectName} && npm install`));
            }
        }

        // Success message
        console.log(chalk.green('\n✅ Project created successfully!\n'));
        console.log(chalk.bold('Next steps:'));
        console.log(chalk.gray(`  cd ${projectName}`));
        
        if (options.skipInstall) {
            console.log(chalk.gray('  pnpm install  # or npm install'));
        }
        
        console.log(chalk.gray('  pnpm run build'));
        console.log(chalk.gray('  pnpm run repl\n'));
        
        console.log(chalk.blue('📚 Documentation: https://github.com/objectql/objectql'));

    } catch (error: any) {
        console.error(chalk.red(`\n❌ Failed to create project: ${error.message}`));
        // Clean up
        if (fs.existsSync(targetDir)) {
            fs.rmSync(targetDir, { recursive: true, force: true });
        }
        process.exit(1);
    }
}

async function copyDirectory(src: string, dest: string, ignore: string[] = []) {
    // Create destination directory
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        // Skip ignored directories
        if (ignore.includes(entry.name)) {
            continue;
        }

        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath, ignore);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

async function checkCommand(cmd: string): Promise<boolean> {
    try {
        await execAsync(`${cmd} --version`);
        return true;
    } catch {
        return false;
    }
}
