const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findFiles(dir, match) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('dist')) {
                results = results.concat(findFiles(file, match));
            }
        } else {
            if (file.match(match)) {
                results.push(file);
            }
        }
    });
    return results;
}

// 1. Update package.json
const packageJsons = findFiles(process.cwd(), /package\.json$/);
packageJsons.forEach(pkgPath => {
    try {
        const content = fs.readFileSync(pkgPath, 'utf8');
        const json = JSON.parse(content);
        let modified = false;

        // Update script
        if (json.scripts && json.scripts.test && (json.scripts.test === 'jest' || json.scripts.test.includes('jest '))) {
            json.scripts.test = 'vitest run';
            modified = true;
        }

        // Remove deps
        const depsToRemove = ['jest', 'ts-jest', '@types/jest'];
        if (json.devDependencies) {
            depsToRemove.forEach(dep => {
                if (json.devDependencies[dep]) {
                    delete json.devDependencies[dep];
                    modified = true;
                }
            });
        }
        
        // Handle root package.json specially - leave only root deps if needed or remove them. 
        // Instructions said remove them.
        if (pkgPath === path.join(process.cwd(), 'package.json')) {
             depsToRemove.forEach(dep => {
                if (json.devDependencies && json.devDependencies[dep]) {
                    delete json.devDependencies[dep];
                    modified = true;
                }
            });
        }

        if (modified) {
            fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2) + '\n');
            console.log('Updated:', pkgPath);
        }
    } catch (e) {
        console.error('Error processing:', pkgPath, e);
    }
});

// 2. Remove jest configs
const jestConfigs = findFiles(process.cwd(), /jest\.config\.(js|ts|base\.js)$/);
jestConfigs.forEach(configPath => {
    // Skip node_modules check again just in case
    if (configPath.includes('node_modules')) return;
    
    fs.unlinkSync(configPath);
    console.log('Deleted:', configPath);
});

console.log('Migration script complete.');
