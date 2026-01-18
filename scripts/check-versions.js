/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');

function findPackageJsons(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        findPackageJsons(filePath, fileList);
      }
    } else {
      if (file === 'package.json') {
        fileList.push(filePath);
      }
    }
  });
  return fileList;
}

const packageJsonFiles = findPackageJsons(packagesDir);
const packageVersions = {};

packageJsonFiles.forEach(file => {
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (content.name && !content.private) { // Only check public packages or those explicitly in the list
     packageVersions[content.name] = {
         version: content.version,
         path: file
     };
  } else if (content.name && content.name.startsWith('@objectql/starter-')) {
     // Include starters even if they might be private (though we set them public earlier)
     packageVersions[content.name] = {
         version: content.version,
         path: file
     };
  }
});

// Load changeset config
const changesetConfigPath = path.join(rootDir, '.changeset', 'config.json');
if (!fs.existsSync(changesetConfigPath)) {
    console.warn("No .changeset/config.json found, skipping check.");
    process.exit(0);
}

const changesetConfig = JSON.parse(fs.readFileSync(changesetConfigPath, 'utf8'));
const fixedGroups = changesetConfig.fixed || [];

let hasError = false;

fixedGroups.forEach((group, index) => {
    const versionsInGroup = new Set();
    const details = [];

    group.forEach(pkgName => {
        if (packageVersions[pkgName]) {
            const v = packageVersions[pkgName].version;
            versionsInGroup.add(v);
            details.push(`${pkgName}: ${v}`);
        }
    });

    if (versionsInGroup.size > 1) {
        console.error(`Error: Version mismatch in fixed group ${index + 1}:`);
        details.forEach(d => console.error(`  - ${d}`));
        hasError = true;
    } else if (versionsInGroup.size === 1) {
        const v = Array.from(versionsInGroup)[0];
        console.log(`✓ Group ${index + 1} synchronized at version ${v} (${details.length} packages)`);
    }
});

const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const rootVersion = packageJson.version;
// Optionally check if root version matches the packages? 
// Usually monorepo root version matches the main release version.

if (hasError) {
    process.exit(1);
} else {
    console.log("All fixed package groups are synchronized.");
}
