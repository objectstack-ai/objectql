#!/usr/bin/env node

/**
 * Script to add MIT license headers to all source files in the ObjectQL project.
 * 
 * This script:
 * 1. Recursively finds all .ts, .js, .tsx, .jsx, .vue files
 * 2. Excludes node_modules, dist, build, .git, coverage directories
 * 3. Checks if files already have license headers (prevents duplicates)
 * 4. Adds MIT license header at the top of files without it
 */

const fs = require('fs');
const path = require('path');

// License header template
const LICENSE_HEADER = `/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

`;

// Directories to exclude from traversal
const EXCLUDED_DIRS = new Set(['node_modules', 'dist', 'build', '.git', 'coverage']);

// File extensions to process
const TARGET_EXTENSIONS = new Set(['.ts', '.js', '.tsx', '.jsx', '.vue']);

/**
 * Check if a file already has a license header
 * @param {string} content - File content
 * @returns {boolean} - True if file has "Copyright" or "License" in first 10 lines
 */
function hasLicenseHeader(content) {
  const lines = content.split('\n').slice(0, 10);
  const firstTenLines = lines.join('\n').toLowerCase();
  return firstTenLines.includes('copyright') || firstTenLines.includes('license');
}

/**
 * Recursively find all target files in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} files - Array to collect file paths
 */
function findTargetFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip excluded directories
      if (!EXCLUDED_DIRS.has(entry.name)) {
        findTargetFiles(fullPath, files);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (TARGET_EXTENSIONS.has(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Add license header to a file
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if header was added, false if skipped
 */
function addLicenseHeader(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check if file already has a license header
    if (hasLicenseHeader(content)) {
      return false;
    }

    // Add license header at the top
    const newContent = LICENSE_HEADER + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main execution function
 */
function main() {
  const rootDir = path.resolve(__dirname, '..');
  
  console.log('🔍 Searching for source files...');
  const files = findTargetFiles(rootDir);
  console.log(`📄 Found ${files.length} source files\n`);

  let processedCount = 0;
  let skippedCount = 0;

  console.log('⚙️  Processing files...\n');
  
  for (const file of files) {
    const relativePath = path.relative(rootDir, file);
    const added = addLicenseHeader(file);

    if (added) {
      console.log(`✅ Added header: ${relativePath}`);
      processedCount++;
    } else {
      console.log(`⏭️  Skipped (has header): ${relativePath}`);
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✨ Complete!`);
  console.log(`   Added headers: ${processedCount}`);
  console.log(`   Skipped (already has header): ${skippedCount}`);
  console.log(`   Total files: ${files.length}`);
  console.log('='.repeat(60));
}

// Run the script
main();
