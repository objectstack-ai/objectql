#!/usr/bin/env node

/**
 * Dashboard Data Collector
 * 
 * Extracts metrics from the ObjectQL project for the progress dashboard.
 * Run this script to update dashboard data automatically.
 * 
 * Usage:
 *   node scripts/collect-dashboard-data.js
 * 
 * Output:
 *   docs/dashboard/data/metrics.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'docs/dashboard/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'metrics.json');

/**
 * Collect Git statistics
 */
function collectGitStats() {
  try {
    const commits = execSync('git log --oneline -10', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .map(line => {
        const [sha, ...messageParts] = line.split(' ');
        return {
          sha: sha.substring(0, 7),
          message: messageParts.join(' ')
        };
      });

    const contributors = execSync('git log --format="%an" | sort -u | wc -l', { encoding: 'utf-8' })
      .trim();

    const totalCommits = execSync('git rev-list --count HEAD', { encoding: 'utf-8' })
      .trim();

    return {
      recentCommits: commits,
      totalContributors: parseInt(contributors, 10),
      totalCommits: parseInt(totalCommits, 10)
    };
  } catch (error) {
    console.warn('Failed to collect Git stats:', error.message);
    return {
      recentCommits: [],
      totalContributors: 0,
      totalCommits: 0
    };
  }
}

/**
 * Collect package information
 */
function collectPackageInfo() {
  const packagesDir = path.join(PROJECT_ROOT, 'packages');
  const packages = [];

  function scanDirectory(dir, category) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        const packageJsonPath = path.join(itemPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          packages.push({
            name: packageJson.name,
            version: packageJson.version,
            category: category,
            private: packageJson.private || false
          });
        }
      }
    }
  }

  // Scan different package categories
  scanDirectory(path.join(packagesDir, 'foundation'), 'Foundation');
  scanDirectory(path.join(packagesDir, 'drivers'), 'Drivers');
  scanDirectory(path.join(packagesDir, 'runtime'), 'Runtime');
  scanDirectory(path.join(packagesDir, 'tools'), 'Tools');

  return packages;
}

/**
 * Collect test coverage data
 */
function collectCoverageData() {
  const coverageFiles = [];
  const packagesDir = path.join(PROJECT_ROOT, 'packages');

  function findCoverageFiles(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        const coveragePath = path.join(itemPath, 'coverage/coverage-summary.json');
        if (fs.existsSync(coveragePath)) {
          const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
          const packageJsonPath = path.join(itemPath, 'package.json');
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          
          coverageFiles.push({
            package: packageJson.name,
            coverage: Math.round(coverage.total.lines.pct)
          });
        }
      }
    }
  }

  findCoverageFiles(path.join(packagesDir, 'foundation'));
  findCoverageFiles(path.join(packagesDir, 'drivers'));
  findCoverageFiles(path.join(packagesDir, 'runtime'));

  // Calculate overall coverage
  const totalCoverage = coverageFiles.length > 0
    ? Math.round(coverageFiles.reduce((sum, p) => sum + p.coverage, 0) / coverageFiles.length)
    : 0;

  return {
    overall: totalCoverage,
    packages: coverageFiles
  };
}

/**
 * Parse project status from markdown
 */
function parseProjectStatus() {
  const statusFile = path.join(PROJECT_ROOT, 'docs/project-status.md');
  if (!fs.existsSync(statusFile)) {
    console.warn('project-status.md not found');
    return {};
  }

  const content = fs.readFileSync(statusFile, 'utf-8');
  
  // Extract overall completion (simple regex)
  const overallMatch = content.match(/Overall Completion.*?(\d+)%/);
  const overallCompletion = overallMatch ? parseInt(overallMatch[1], 10) : 75;

  return {
    overallCompletion,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Collecting ObjectQL Dashboard Metrics...\n');

  const metrics = {
    timestamp: new Date().toISOString(),
    git: collectGitStats(),
    packages: collectPackageInfo(),
    coverage: collectCoverageData(),
    status: parseProjectStatus()
  };

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write metrics to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metrics, null, 2));

  console.log('✅ Dashboard metrics collected successfully!');
  console.log(`📊 Output: ${OUTPUT_FILE}\n`);
  console.log('Summary:');
  console.log(`  - Total Packages: ${metrics.packages.length}`);
  console.log(`  - Total Contributors: ${metrics.git.totalContributors}`);
  console.log(`  - Total Commits: ${metrics.git.totalCommits}`);
  console.log(`  - Overall Coverage: ${metrics.coverage.overall}%`);
  console.log(`  - Project Completion: ${metrics.status.overallCompletion}%`);
}

if (require.main === module) {
  main();
}

module.exports = { collectGitStats, collectPackageInfo, collectCoverageData, parseProjectStatus };
