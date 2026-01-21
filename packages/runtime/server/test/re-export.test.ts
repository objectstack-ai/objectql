/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Compatibility test to ensure @objectql/server properly re-exports from @objectql/plugin-server
 */

describe('@objectql/server compatibility layer', () => {
    it('should re-export createNodeHandler', () => {
        const { createNodeHandler } = require('../src/index');
        expect(createNodeHandler).toBeDefined();
        expect(typeof createNodeHandler).toBe('function');
    });

    it('should re-export createRESTHandler', () => {
        const { createRESTHandler } = require('../src/index');
        expect(createRESTHandler).toBeDefined();
        expect(typeof createRESTHandler).toBe('function');
    });

    it('should re-export createGraphQLHandler', () => {
        const { createGraphQLHandler } = require('../src/index');
        expect(createGraphQLHandler).toBeDefined();
        expect(typeof createGraphQLHandler).toBe('function');
    });

    it('should re-export createMetadataHandler', () => {
        const { createMetadataHandler } = require('../src/index');
        expect(createMetadataHandler).toBeDefined();
        expect(typeof createMetadataHandler).toBe('function');
    });

    it('should re-export createHonoAdapter', () => {
        const { createHonoAdapter } = require('../src/index');
        expect(createHonoAdapter).toBeDefined();
        expect(typeof createHonoAdapter).toBe('function');
    });

    it('should re-export ServerPlugin', () => {
        const { ServerPlugin } = require('../src/index');
        expect(ServerPlugin).toBeDefined();
        expect(typeof ServerPlugin).toBe('function');
    });

    it('should re-export ObjectQLServer', () => {
        const { ObjectQLServer } = require('../src/index');
        expect(ObjectQLServer).toBeDefined();
        expect(typeof ObjectQLServer).toBe('function');
    });
});
