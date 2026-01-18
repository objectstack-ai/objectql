/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectConfig, MetadataRegistry } from '@objectql/types';

export function registerObjectHelper(metadata: MetadataRegistry, object: ObjectConfig) {
    // Normalize fields
    if (object.fields) {
        for (const [key, field] of Object.entries(object.fields)) {
            if (!field.name) {
                field.name = key;
            }
        }
    }
    metadata.register('object', {
        type: 'object',
        id: object.name,
        content: object
    });
}

export function getConfigsHelper(metadata: MetadataRegistry): Record<string, ObjectConfig> {
    const result: Record<string, ObjectConfig> = {};
    const objects = metadata.list<ObjectConfig>('object');
    for (const obj of objects) {
        result[obj.name] = obj;
    }
    return result;
}
