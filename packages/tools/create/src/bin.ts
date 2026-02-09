#!/usr/bin/env node
/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import chalk from 'chalk';
import Enquirer from 'enquirer';

const { prompt } = Enquirer;

const program = new Command();

program
  .name('create-objectql')
  .description('Scaffold a new ObjectQL project')
  .argument('[directory]', 'Directory to create the project in')
  .option('-t, --template <name>', 'Template to use (hello-world, starter, enterprise)')
  .action(async (directory, options) => {
    console.log(chalk.bold.blue('⚡ ObjectStack AI - Project Scaffolder'));

    // 1. Resolve Target Directory
    let targetDir = directory;
    if (!targetDir) {
      const response = await prompt<{ dir: string }>({
        type: 'input',
        name: 'dir',
        message: 'Where should we create the project?',
        initial: 'my-app'
      });
      targetDir = response.dir;
    }
    const root = path.resolve(process.cwd(), targetDir);

    // 2. Resolve Template Source (Embedded)
    // The templates are located in ../templates relative to the dist/bin.js file
    // dist/bin.js -> ../templates -> package-root/templates
    let templateName = options.template;

    if (!templateName) {
      const response = await prompt<{ template: string }>({
        type: 'select',
        name: 'template',
        message: 'Select a starter template:',
        choices: [
          { message: 'Standard Project (Recommended)', name: 'starter' },
          { message: 'Enterprise ERP System', name: 'enterprise' },
          { message: 'Minimal (Hello World)', name: 'hello-world' }
        ]
      });
      templateName = response.template;
    }
    
    // Legacy mapping or aliasing if needed
    if (templateName === 'project-tracker') templateName = 'starter';

    const templatePath = path.resolve(__dirname, '../templates', templateName);

    if (!fs.existsSync(templatePath)) {
      console.error(chalk.red(`❌ Template '${templateName}' not found in package.`));
      console.error(chalk.gray(`Path looked for: ${templatePath}`));
      process.exit(1);
    }

    // 3. Copy Files
    console.log(`\nCreating project in ${chalk.green(root)}...`);
    await fs.ensureDir(root);
    await fs.copy(templatePath, root);

    // 4. Update package.json (De-monorepo)
    const pkgPath = path.join(root, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      pkg.name = path.basename(root);
      delete pkg.private;
      delete pkg.repository; 
      
      const updateDeps = (deps: Record<string, string>) => {
        if (!deps) return;
        for (const key in deps) {
          if (deps[key] === 'workspace:*') {
            deps[key] = 'latest';
          }
        }
      };

      updateDeps(pkg.dependencies);
      updateDeps(pkg.devDependencies);
      
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    }

    // 5. Initialize Git
    try {
        await fs.writeFile(path.join(root, '.gitignore'), `node_modules/\ndist/\n*.log\n.DS_Store\n*.sqlite3\n.env\n.env.local\n`);
    } catch (_e) { /* .gitignore write failure is non-critical */ }

    console.log(chalk.green('\n✅ Done! Now run:\n'));
    console.log(chalk.cyan(`  cd ${targetDir}`));
    console.log(chalk.cyan(`  npm install`));
    console.log(chalk.cyan(`  npm start`));
  });

program.parse(process.argv);
