/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLSecurityPlugin } from '@objectql/plugin-security';
import { ValidatorPlugin } from '@objectql/plugin-validator';
import { GraphQLPlugin } from '@objectql/protocol-graphql';
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';
import { RestPlugin } from '@objectql/protocol-rest';
import { HonoServerPlugin } from '@objectstack/plugin-hono-server';
import { ObjectQLPlugin } from '@objectql/core';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

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
        new HonoServerPlugin({
            port: 5050,
        }),
        new ObjectQLPlugin({
            enableRepository: true,
            enableQueryService: true
        }),
        new ObjectQLSecurityPlugin({
            enableAudit: false
        }),
        new ValidatorPlugin(),
        new GraphQLPlugin({
            basePath: '/graphql',
            introspection: true,
            enableSubscriptions: true
        }),
        new ODataV4Plugin({
            basePath: '/odata',
            enableBatch: true,
            enableSearch: true,
            enableETags: true
        }),
        new JSONRPCPlugin({
            basePath: '/rpc',
            enableIntrospection: true,
            enableSessions: true
        }),
        // new RestPlugin({
        //     basePath: '/api'
        // })
    ]
};
