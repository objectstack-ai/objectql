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
  }
  
  console.log('Templates copied successfully.');
}

copyTemplates().catch(err => {
  console.error(err);
  process.exit(1);
});
