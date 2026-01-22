/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Mock for @objectstack/runtime
 * This mock is needed because the npm package has issues with Jest
 * and we want to focus on testing ObjectQL's logic, not the kernel integration.
 */
export function setupObjectStackRuntimeMock() {
    jest.mock('@objectstack/runtime', () => {
        return {
            ObjectStackKernel: jest.fn().mockImplementation(() => ({
                ql: null,
                start: jest.fn().mockResolvedValue(undefined),
                seed: jest.fn().mockResolvedValue(undefined),
                find: jest.fn().mockResolvedValue({ value: [], count: 0 }),
                get: jest.fn().mockResolvedValue({}),
                create: jest.fn().mockResolvedValue({}),
                update: jest.fn().mockResolvedValue({}),
                delete: jest.fn().mockResolvedValue(true),
                getMetadata: jest.fn().mockReturnValue({}),
                getView: jest.fn().mockReturnValue(null),
            })),
        };
    });
}
