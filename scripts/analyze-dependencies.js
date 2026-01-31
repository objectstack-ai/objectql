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
 * Extract dependencies from package.json
 */
function extractDependencies(packageJson) {
  const deps = {
    internal: [],
    external: []
  };
  
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.peerDependencies
  };
  
  Object.keys(allDeps || {}).forEach(dep => {
    if (dep.startsWith('@objectql/') || dep.startsWith('@objectstack/')) {
      if (dep.startsWith('@objectql/')) {
        deps.internal.push({ name: dep, version: allDeps[dep] });
      } else {
        deps.external.push({ name: dep, version: allDeps[dep] });
      }
    }
  });
  
  return deps;
}

/**
 * Build dependency graph
 */
function buildDependencyGraph() {
  const packageJsonFiles = findPackageJsons(packagesDir);
  const graph = {};
  
  packageJsonFiles.forEach(file => {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (content.name) {
      const deps = extractDependencies(content);
      graph[content.name] = {
        version: content.version,
        path: file.replace(rootDir + '/', ''),
        dependencies: deps
      };
    }
  });
  
  return graph;
}

/**
 * Detect circular dependencies
 */
function detectCircular(graph, node, visited = new Set(), path = []) {
  if (path.includes(node)) {
    return [[...path, node]];
  }
  
  if (visited.has(node)) {
    return [];
  }
  
  visited.add(node);
  const cycles = [];
  
  if (graph[node]) {
    graph[node].dependencies.internal.forEach(dep => {
      const subCycles = detectCircular(graph, dep.name, visited, [...path, node]);
      cycles.push(...subCycles);
    });
  }
  
  return cycles;
}

/**
 * Analyze external dependencies
 */
function analyzeExternalDeps(graph) {
  const externalDeps = {};
  
  Object.keys(graph).forEach(pkg => {
    graph[pkg].dependencies.external.forEach(dep => {
      if (!externalDeps[dep.name]) {
        externalDeps[dep.name] = {
          versions: new Set(),
          usedBy: []
        };
      }
      externalDeps[dep.name].versions.add(dep.version);
      externalDeps[dep.name].usedBy.push(pkg);
    });
  });
  
  return externalDeps;
}

/**
 * Generate dependency report
 */
function generateReport() {
  console.log('🔍 Analyzing ObjectQL Dependency Graph...\n');
  
  const graph = buildDependencyGraph();
  
  console.log(`📦 Found ${Object.keys(graph).length} packages\n`);
  
  // Check for circular dependencies
  console.log('🔄 Checking for circular dependencies...');
  const allCycles = [];
  Object.keys(graph).forEach(pkg => {
    const cycles = detectCircular(graph, pkg);
    cycles.forEach(cycle => {
      // Normalize cycle to avoid duplicates
      const normalized = cycle.join(' → ');
      if (!allCycles.includes(normalized)) {
        allCycles.push(normalized);
      }
    });
  });
  
  if (allCycles.length > 0) {
    console.log(`\n⚠️  Found ${allCycles.length} potential circular dependency chain(s):\n`);
    allCycles.forEach((cycle, i) => {
      console.log(`  ${i + 1}. ${cycle}`);
    });
  } else {
    console.log('✅ No circular dependencies detected within @objectql/* packages\n');
  }
  
  // Analyze external dependencies
  console.log('\n📊 External Dependencies (@objectstack/*):\n');
  const externalDeps = analyzeExternalDeps(graph);
  
  Object.keys(externalDeps).sort().forEach(dep => {
    const info = externalDeps[dep];
    const versions = Array.from(info.versions);
    const versionStatus = versions.length === 1 ? '✅' : '⚠️';
    
    console.log(`  ${versionStatus} ${dep}`);
    console.log(`     Versions: ${versions.join(', ')}`);
    console.log(`     Used by ${info.usedBy.length} package(s): ${info.usedBy.slice(0, 3).join(', ')}${info.usedBy.length > 3 ? '...' : ''}`);
    console.log('');
  });
  
  // Generate mermaid diagram
  console.log('\n📈 Generating dependency graph (Mermaid format)...\n');
  
  return { graph, cycles: allCycles, externalDeps };
}

/**
 * Generate Mermaid diagram
 */
function generateMermaidDiagram(graph) {
  let mermaid = 'graph TD\n';
  
  // Group packages by layer
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
  
  Object.keys(graph).forEach(pkg => {
    if (pkg.includes('/types')) layers.types.push(pkg);
    else if (pkg.includes('/plugin-')) layers.plugins.push(pkg);
    else if (pkg.includes('/core')) layers.core.push(pkg);
    else if (pkg.includes('/platform-')) layers.platform.push(pkg);
    else if (pkg.includes('/driver-') || pkg === '@objectql/sdk') layers.drivers.push(pkg);
    else if (pkg.includes('/protocol-')) layers.protocols.push(pkg);
    else if (pkg.includes('/server')) layers.runtime.push(pkg);
    else layers.tools.push(pkg);
  });
  
  // Add nodes with styling
  mermaid += '\n  %% Layer: Types\n';
  layers.types.forEach(pkg => {
    mermaid += `  ${pkg.replace('@objectql/', '').replace('-', '_')}["${pkg}"]:::types\n`;
  });
  
  mermaid += '\n  %% Layer: Plugins\n';
  layers.plugins.forEach(pkg => {
    mermaid += `  ${pkg.replace('@objectql/', '').replace(/-/g, '_')}["${pkg}"]:::plugins\n`;
  });
  
  mermaid += '\n  %% Layer: Core\n';
  layers.core.forEach(pkg => {
    mermaid += `  ${pkg.replace('@objectql/', '').replace('-', '_')}["${pkg}"]:::core\n`;
  });
  
  mermaid += '\n  %% Layer: Platform\n';
  layers.platform.forEach(pkg => {
    mermaid += `  ${pkg.replace('@objectql/', '').replace(/-/g, '_')}["${pkg}"]:::platform\n`;
  });
  
  // Add dependencies
  mermaid += '\n  %% Dependencies\n';
  Object.keys(graph).forEach(pkg => {
    const pkgId = pkg.replace('@objectql/', '').replace(/-/g, '_');
    graph[pkg].dependencies.internal.forEach(dep => {
      const depId = dep.name.replace('@objectql/', '').replace(/-/g, '_');
      mermaid += `  ${pkgId} --> ${depId}\n`;
    });
  });
  
  // Add styling
  mermaid += '\n  classDef types fill:#e1f5e1,stroke:#4caf50,stroke-width:2px\n';
  mermaid += '  classDef plugins fill:#fff3e0,stroke:#ff9800,stroke-width:2px\n';
  mermaid += '  classDef core fill:#e3f2fd,stroke:#2196f3,stroke-width:2px\n';
  mermaid += '  classDef platform fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px\n';
  
  return mermaid;
}

// Main execution
const result = generateReport();

// Save mermaid diagram
const mermaidDiagram = generateMermaidDiagram(result.graph);
const outputPath = path.join(rootDir, 'DEPENDENCY_GRAPH.md');
const markdown = `# ObjectQL Dependency Graph

**Generated**: ${new Date().toISOString()}

## Visual Representation

\`\`\`mermaid
${mermaidDiagram}
\`\`\`

## Analysis Summary

- **Total Packages**: ${Object.keys(result.graph).length}
- **Circular Dependencies**: ${result.cycles.length === 0 ? 'None detected ✅' : result.cycles.length + ' found ⚠️'}
- **External Dependencies**: ${Object.keys(result.externalDeps).length} unique packages

${result.cycles.length > 0 ? `
### ⚠️ Circular Dependency Chains

${result.cycles.map((cycle, i) => `${i + 1}. \`${cycle}\``).join('\n')}
` : ''}

## External Dependencies

${Object.keys(result.externalDeps).sort().map(dep => {
  const info = result.externalDeps[dep];
  const versions = Array.from(info.versions);
  return `### ${dep}

- **Versions**: ${versions.join(', ')}
- **Used by**: ${info.usedBy.length} package(s)
  ${info.usedBy.map(pkg => `  - ${pkg}`).join('\n')}
`;
}).join('\n')}

## Package Details

${Object.keys(result.graph).sort().map(pkg => {
  const info = result.graph[pkg];
  return `### ${pkg} (v${info.version})

**Path**: \`${info.path}\`

**Internal Dependencies** (${info.dependencies.internal.length}):
${info.dependencies.internal.length > 0 ? info.dependencies.internal.map(d => `- ${d.name} (${d.version})`).join('\n') : '- None'}

**External Dependencies** (${info.dependencies.external.length}):
${info.dependencies.external.length > 0 ? info.dependencies.external.map(d => `- ${d.name} (${d.version})`).join('\n') : '- None'}
`;
}).join('\n')}
`;

fs.writeFileSync(outputPath, markdown);
console.log(`\n✅ Dependency graph saved to: DEPENDENCY_GRAPH.md`);
