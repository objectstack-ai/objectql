/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs-extra');
const path = require('path');

async function copyTemplates() {
  const root = path.resolve(__dirname, '..');
  const templatesDir = path.join(root, 'templates');
  const examplesDir = path.resolve(root, '../../../examples');

  // Clean
  await fs.remove(templatesDir);
  await fs.ensureDir(templatesDir);

  const filterFunc = (src, dest) => {
    const stats = fs.statSync(src);
    const filename = path.basename(src);
    
    // Directory exclusions
    if (stats.isDirectory()) {
      return !['node_modules', 'dist', '.turbo', '.git'].includes(filename);
    }
    // File exclusions
    return !['.DS_Store', 'pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'].includes(filename);
  };

  const tasks = [
    {
      src: path.join(examplesDir, 'quickstart/hello-world'),
      dest: path.join(templatesDir, 'hello-world')
    },
    {
      src: path.join(examplesDir, 'showcase/project-tracker'),
      dest: path.join(templatesDir, 'starter')
    },
    {
      src: path.join(examplesDir, 'showcase/enterprise-erp'),
      dest: path.join(templatesDir, 'enterprise')
    }
  ];

  for (const task of tasks) {
    if (!fs.existsSync(task.src)) {
      console.warn(`Warning: Source not found: ${task.src}`);
      continue;
    }
    console.log(`Copying ${task.src} -> ${task.dest}`);
    await fs.copy(task.src, task.dest, { filter: filterFunc });
    
    // Fix tsconfig.json (Remove dependency on monorepo base)
    const tsconfigPath = path.join(task.dest, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      const tsconfig = await fs.readJson(tsconfigPath);
      delete tsconfig.extends;
      
      // Inject standalone compiler options
      tsconfig.compilerOptions = {
        target: "ES2019",
        module: "commonjs",
        declaration: true,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        moduleResolution: "node",
        sourceMap: true,
        outDir: "./dist",
        rootDir: "./src",
        resolveJsonModule: true,
        ...tsconfig.compilerOptions // Keep any specific overrides
      };
      
      await fs.writeJson(tsconfigPath, tsconfig, { spaces: 2 });
    }
  }
  
  console.log('Templates copied successfully.');
}

copyTemplates().catch(err => {
  console.error(err);
  process.exit(1);
});
