/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCHEMAS_DIR = path.resolve(__dirname, '../schemas');
const TYPES_DIR = path.resolve(__dirname, '../src');
const BIN = path.resolve(__dirname, '../node_modules/.bin/ts-json-schema-generator');
const TSCONFIG = path.resolve(__dirname, '../tsconfig.json');

const schemas = [
    { type: 'ObjectConfig', file: 'object.ts', schema: 'object.schema.json' },
    { type: 'AppConfig', file: 'application.ts', schema: 'app.schema.json' },
    { type: 'PageConfig', file: 'page.ts', schema: 'page.schema.json' },
    { type: 'MenuConfig', file: 'menu.ts', schema: 'menu.schema.json' }
];

if (!fs.existsSync(SCHEMAS_DIR)) {
    fs.mkdirSync(SCHEMAS_DIR, { recursive: true });
}

schemas.forEach(config => {
    const filePath = path.join(TYPES_DIR, config.file);
    const schemaPath = path.join(SCHEMAS_DIR, config.schema);
    
    console.log(`Generating schema for ${config.type} from ${config.file}...`);
    
    try {
        const cmd = `${BIN} --tsconfig ${TSCONFIG} --path ${filePath} --type ${config.type} --out ${schemaPath} --no-type-check`;
        execSync(cmd, { stdio: 'inherit' });
        console.log(`✓ Generated ${config.schema}`);
        
        // Post-process to add $schema and other metadata if needed, 
        // though ts-json-schema-generator does a good job.
        // We might want to ensure additionalProperties is false if not specified, etc.
        
    } catch (e) {
        console.error(`✗ Failed to generate ${config.schema}`);
        console.error(e.message);
        process.exit(1);
    }
});
