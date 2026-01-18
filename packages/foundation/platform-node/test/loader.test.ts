/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { loadObjectConfigs } from '../src/loader';
import * as path from 'path';

describe('Loader', () => {
    it('should load object configs from directory', () => {
        const fixturesDir = path.join(__dirname, 'fixtures');
        const configs = loadObjectConfigs(fixturesDir);
        expect(configs).toBeDefined();
        expect(configs['project']).toBeDefined();
        expect(configs['project'].name).toBe('project');
        expect(configs['project'].fields).toBeDefined();
        expect(configs['project'].fields.name).toBeDefined();
    });
});

