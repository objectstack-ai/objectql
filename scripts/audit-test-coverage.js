#!/usr/bin/env node
/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const packagesDir = path.join(rootDir, 'packages');

/**
 * Find all package.json files in the monorepo
 */
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

/**
 * Find test files for a package
 */
function findTestFiles(packageDir) {
  const testFiles = [];
  const extensions = ['.test.ts', '.test.js', '.spec.ts', '.spec.js'];
  
  function searchDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== 'dist' && file !== 'coverage') {
          searchDir(filePath);
        }
      } else {
        if (extensions.some(ext => file.endsWith(ext))) {
          testFiles.push(filePath);
        }
      }
    });
  }
  
  searchDir(packageDir);
  return testFiles;
}

/**
 * Count source files
 */
function countSourceFiles(packageDir) {
  let count = 0;
  const srcDir = path.join(packageDir, 'src');
  
  if (!fs.existsSync(srcDir)) return 0;
  
  function searchDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        searchDir(filePath);
      } else {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          count++;
        }
      }
    });
  }
  
  searchDir(srcDir);
  return count;
}

/**
 * Check if package has test configuration
 */
function hasTestConfig(packageDir) {
  const jestConfig = path.join(packageDir, 'jest.config.js');
  const vitestConfig = path.join(packageDir, 'vitest.config.ts');
  
  return fs.existsSync(jestConfig) || fs.existsSync(vitestConfig);
}

/**
 * Analyze test coverage for all packages
 */
function analyzeTestCoverage() {
  console.log('🔍 Auditing Test Coverage for ObjectQL Monorepo...\n');
  
  const packageJsonFiles = findPackageJsons(packagesDir);
  const results = [];
  
  packageJsonFiles.forEach(file => {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.name) return;
    
    const packageDir = path.dirname(file);
    const testFiles = findTestFiles(packageDir);
    const sourceFiles = countSourceFiles(packageDir);
    const hasConfig = hasTestConfig(packageDir);
    const hasTestScript = content.scripts && content.scripts.test;
    
    results.push({
      name: content.name,
      version: content.version,
      path: packageDir.replace(rootDir + '/', ''),
      testFiles: testFiles.length,
      sourceFiles,
      hasTestConfig: hasConfig,
      hasTestScript: !!hasTestScript,
      testFramework: hasConfig ? (fs.existsSync(path.join(packageDir, 'jest.config.js')) ? 'Jest' : 'Vitest') : 'None'
    });
  });
  
  // Sort by layer
  const layers = {
    types: [],
    plugins: [],
    core: [],
    platform: [],
    drivers: [],
    protocols: [],
    runtime: [],
    tools: []
  };
  
  results.forEach(pkg => {
    if (pkg.name.includes('/types')) layers.types.push(pkg);
    else if (pkg.name.includes('/plugin-')) layers.plugins.push(pkg);
    else if (pkg.name.includes('/core')) layers.core.push(pkg);
    else if (pkg.name.includes('/platform-')) layers.platform.push(pkg);
    else if (pkg.name.includes('/driver-') || pkg.name === '@objectql/sdk') layers.drivers.push(pkg);
    else if (pkg.name.includes('/protocol-')) layers.protocols.push(pkg);
    else if (pkg.name.includes('/server')) layers.runtime.push(pkg);
    else layers.tools.push(pkg);
  });
  
  // Generate report
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('                    TEST COVERAGE AUDIT REPORT');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  
  const printLayer = (layerName, packages) => {
    if (packages.length === 0) return;
    
    console.log(`\n📦 ${layerName.toUpperCase()} LAYER (${packages.length} package${packages.length > 1 ? 's' : ''})`);
    console.log('─'.repeat(75));
    
    packages.forEach(pkg => {
      const status = pkg.testFiles > 0 ? '✅' : '❌';
      const coverage = pkg.sourceFiles > 0 ? ((pkg.testFiles / pkg.sourceFiles) * 100).toFixed(0) : 'N/A';
      
      console.log(`\n${status} ${pkg.name} (v${pkg.version})`);
      console.log(`   Path: ${pkg.path}`);
      console.log(`   Test Files: ${pkg.testFiles}`);
      console.log(`   Source Files: ${pkg.sourceFiles}`);
      console.log(`   Test Framework: ${pkg.testFramework}`);
      console.log(`   Has Test Config: ${pkg.hasTestConfig ? 'Yes' : 'No'}`);
      console.log(`   Has Test Script: ${pkg.hasTestScript ? 'Yes' : 'No'}`);
      console.log(`   Estimated Coverage: ${coverage}% (files)`);
    });
  };
  
  printLayer('Types', layers.types);
  printLayer('Core', layers.core);
  printLayer('Plugins', layers.plugins);
  printLayer('Platform', layers.platform);
  printLayer('Drivers', layers.drivers);
  printLayer('Protocols', layers.protocols);
  printLayer('Runtime', layers.runtime);
  printLayer('Tools', layers.tools);
  
  // Summary statistics
  console.log('\n\n═══════════════════════════════════════════════════════════════════════');
  console.log('                           SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  
  const totalPackages = results.length;
  const packagesWithTests = results.filter(p => p.testFiles > 0).length;
  const packagesWithConfig = results.filter(p => p.hasTestConfig).length;
  const totalTestFiles = results.reduce((sum, p) => sum + p.testFiles, 0);
  const totalSourceFiles = results.reduce((sum, p) => sum + p.sourceFiles, 0);
  
  console.log(`Total Packages: ${totalPackages}`);
  console.log(`Packages with Tests: ${packagesWithTests} (${((packagesWithTests / totalPackages) * 100).toFixed(1)}%)`);
  console.log(`Packages with Test Config: ${packagesWithConfig} (${((packagesWithConfig / totalPackages) * 100).toFixed(1)}%)`);
  console.log(`Total Test Files: ${totalTestFiles}`);
  console.log(`Total Source Files: ${totalSourceFiles}`);
  console.log(`Overall File Coverage: ${totalSourceFiles > 0 ? ((totalTestFiles / totalSourceFiles) * 100).toFixed(1) : 0}%`);
  
  console.log('\n📊 Test Framework Distribution:');
  const jestCount = results.filter(p => p.testFramework === 'Jest').length;
  const vitestCount = results.filter(p => p.testFramework === 'Vitest').length;
  const noneCount = results.filter(p => p.testFramework === 'None').length;
  
  console.log(`   Jest: ${jestCount} packages`);
  console.log(`   Vitest: ${vitestCount} packages`);
  console.log(`   None: ${noneCount} packages`);
  
  console.log('\n⚠️  Packages Missing Tests:');
  const missingTests = results.filter(p => p.testFiles === 0);
  if (missingTests.length === 0) {
    console.log('   None - All packages have tests! ✅');
  } else {
    missingTests.forEach(pkg => {
      console.log(`   - ${pkg.name}`);
    });
  }
  
  console.log('\n📋 Recommendations:');
  console.log('   1. Add tests to packages without test files');
  console.log('   2. Standardize on Jest (currently at v30.2.0)');
  console.log('   3. Add coverage thresholds to Jest configs');
  console.log('   4. Target: 90% coverage for core, 80% for drivers');
  console.log('   5. Create integration test suite for cross-package testing');
  
  // Generate markdown report
  const markdown = generateMarkdownReport(layers, results, {
    totalPackages,
    packagesWithTests,
    packagesWithConfig,
    totalTestFiles,
    totalSourceFiles,
    jestCount,
    vitestCount,
    noneCount,
    missingTests
  });
  
  const outputPath = path.join(rootDir, 'TEST_COVERAGE_AUDIT.md');
  fs.writeFileSync(outputPath, markdown);
  
  console.log(`\n✅ Test coverage audit report saved to: TEST_COVERAGE_AUDIT.md`);
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(layers, results, stats) {
  let markdown = `# Test Coverage Audit Report

**Generated**: ${new Date().toISOString()}  
**Total Packages**: ${stats.totalPackages}

## Executive Summary

- **Packages with Tests**: ${stats.packagesWithTests}/${stats.totalPackages} (${((stats.packagesWithTests / stats.totalPackages) * 100).toFixed(1)}%)
- **Packages with Test Config**: ${stats.packagesWithConfig}/${stats.totalPackages} (${((stats.packagesWithConfig / stats.totalPackages) * 100).toFixed(1)}%)
- **Total Test Files**: ${stats.totalTestFiles}
- **Total Source Files**: ${stats.totalSourceFiles}
- **Overall File Coverage**: ${stats.totalSourceFiles > 0 ? ((stats.totalTestFiles / stats.totalSourceFiles) * 100).toFixed(1) : 0}%

## Test Framework Distribution

| Framework | Packages | Percentage |
|-----------|----------|------------|
| Jest | ${stats.jestCount} | ${((stats.jestCount / stats.totalPackages) * 100).toFixed(1)}% |
| Vitest | ${stats.vitestCount} | ${((stats.vitestCount / stats.totalPackages) * 100).toFixed(1)}% |
| None | ${stats.noneCount} | ${((stats.noneCount / stats.totalPackages) * 100).toFixed(1)}% |

## Packages Missing Tests

${stats.missingTests.length === 0 ? '✅ All packages have tests!\n' : stats.missingTests.map(pkg => `- ❌ ${pkg.name}`).join('\n')}

## Detailed Package Analysis

`;

  const printLayerMd = (layerName, packages) => {
    if (packages.length === 0) return '';
    
    let md = `### ${layerName} Layer (${packages.length} package${packages.length > 1 ? 's' : ''})\n\n`;
    
    packages.forEach(pkg => {
      const status = pkg.testFiles > 0 ? '✅' : '❌';
      const coverage = pkg.sourceFiles > 0 ? ((pkg.testFiles / pkg.sourceFiles) * 100).toFixed(0) : 'N/A';
      
      md += `#### ${status} ${pkg.name} (v${pkg.version})\n\n`;
      md += `- **Path**: \`${pkg.path}\`\n`;
      md += `- **Test Files**: ${pkg.testFiles}\n`;
      md += `- **Source Files**: ${pkg.sourceFiles}\n`;
      md += `- **Test Framework**: ${pkg.testFramework}\n`;
      md += `- **Has Test Config**: ${pkg.hasTestConfig ? 'Yes' : 'No'}\n`;
      md += `- **Has Test Script**: ${pkg.hasTestScript ? 'Yes' : 'No'}\n`;
      md += `- **Estimated File Coverage**: ${coverage}%\n\n`;
    });
    
    return md;
  };
  
  markdown += printLayerMd('Types', layers.types);
  markdown += printLayerMd('Core', layers.core);
  markdown += printLayerMd('Plugins', layers.plugins);
  markdown += printLayerMd('Platform', layers.platform);
  markdown += printLayerMd('Drivers', layers.drivers);
  markdown += printLayerMd('Protocols', layers.protocols);
  markdown += printLayerMd('Runtime', layers.runtime);
  markdown += printLayerMd('Tools', layers.tools);
  
  markdown += `## Recommendations

### Short Term (Phase 3)

1. **Add Tests to Missing Packages**
   - Focus on packages with 0 test files
   - Prioritize core and driver packages

2. **Standardize Test Framework**
   - Migrate all packages to Jest v30.2.0
   - Remove Vitest dependencies where used

3. **Add Coverage Configuration**
   - Set coverage thresholds in jest.config.js
   - Target: 90% for core packages, 80% for drivers

4. **Create Integration Tests**
   - Test cross-package interactions
   - Test driver compatibility
   - Test protocol adapters

### Medium Term

1. **Enforce Coverage in CI**
   - Add coverage gates to CI pipeline
   - Block merges below threshold

2. **Generate Coverage Reports**
   - Use codecov or similar service
   - Track coverage trends over time

3. **Documentation Testing**
   - Ensure code examples in docs are tested
   - Add README examples as tests

### Long Term

1. **Performance Benchmarks**
   - Add performance regression tests
   - Track query execution times

2. **E2E Testing**
   - Full application testing
   - Browser compatibility testing

## Next Steps

- [ ] Add tests to packages missing test coverage
- [ ] Standardize all packages to Jest v30.2.0
- [ ] Add coverage thresholds to Jest configs
- [ ] Create integration test suite
- [ ] Set up CI coverage reporting
`;

  return markdown;
}

// Main execution
analyzeTestCoverage();
