/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    moduleNameMapper: {
        '^@objectstack/runtime$': '<rootDir>/test/__mocks__/@objectstack/runtime.ts',
        '^@objectstack/core$': '<rootDir>/test/__mocks__/@objectstack/core.ts',
        '^@objectstack/objectql$': '<rootDir>/test/__mocks__/@objectstack/objectql.ts',
        '^@objectql/types$': '<rootDir>/../../foundation/types/src',
        '^@objectql/core$': '<rootDir>/../../foundation/core/src',
        '^@objectql/driver-sql$': '<rootDir>/../../drivers/sql/src',
        '^@objectql/driver-mongo$': '<rootDir>/../../drivers/mongo/src',
        '^(.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            isolatedModules: true,
            tsconfig: {
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            }
        }],
    },
};
