/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQL } from '@objectql/core';
import { ObjectLoader } from '../src';
import * as path from 'path';

describe('Dynamic Package Loading', () => {
    let objectql: ObjectQL;
    let loader: ObjectLoader;

    beforeEach(() => {
        objectql = new ObjectQL({
            datasources: {}
        });
        loader = new ObjectLoader(objectql.metadata);
    });

    test('should load directory manually', () => {
        const fixtureDir = path.join(__dirname, 'fixtures');
        loader.load(fixtureDir, 'test-pkg');
        
        expect(objectql.getObject('project')).toBeDefined();
    });

    test('should remove package objects', () => {
        const fixtureDir = path.join(__dirname, 'fixtures');
        loader.load(fixtureDir, 'test-pkg');
        
        expect(objectql.getObject('project')).toBeDefined();
        
        objectql.removePackage('test-pkg');
        
        expect(objectql.getObject('project')).toBeUndefined();
    });
});
