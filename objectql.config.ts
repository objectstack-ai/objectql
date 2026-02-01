/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLSecurityPlugin } from '@objectql/plugin-security';
import { ValidatorPlugin } from '@objectql/plugin-validator';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// --- Patch for @objectstack/cli @0.8.0 compatibility ---
import { ObjectKernel } from '@objectstack/core';
try {
    const proto = ObjectKernel.prototype;
    if (!(proto as any).registerPlugin && (proto as any).use) {
        (proto as any).registerPlugin = (proto as any).use;
        console.log('Patched ObjectKernel.registerPlugin');
    }
    if (!(proto as any).boot && (proto as any).bootstrap) {
        (proto as any).boot = (proto as any).bootstrap;
        console.log('Patched ObjectKernel.boot');
    }
} catch (e) {
    console.warn('Failed to patch ObjectKernel compatibility:', e);
}
// -------------------------------------------------------

function loadObjects(dir: string) {
    const objects: Record<string, any> = {};
    if (!fs.existsSync(dir)) return objects;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file.endsWith('.object.yml') || file.endsWith('.object.yaml')) {
            const content = fs.readFileSync(path.join(dir, file), 'utf8');
            try {
                const doc = yaml.load(content) as any;
                if (doc) {
                    const name = doc.name || file.replace(/\.object\.ya?ml$/, '');
                    objects[name] = { ...doc, name };
                }
            } catch (e) {
                console.error(`Failed to load ${file}:`, e);
            }
        }
    }
    return objects;
}

const projectTrackerDir = path.join(__dirname, 'examples/showcase/project-tracker/src');

export default {
    metadata: {
        name: 'objectos',
        version: '1.0.0'
    },
    objects: loadObjects(projectTrackerDir),
    // Runtime plugins (instances only)
    plugins: [
        new ObjectQLSecurityPlugin({
            enableAudit: false
        }),
        new ValidatorPlugin()
    ]
};
