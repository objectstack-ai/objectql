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
        '^@objectstack/runtime$': '<rootDir>/../../../../spec/packages/runtime/src',
        '^@objectstack/core$': '<rootDir>/../../../../spec/packages/core/src',
        '^@objectstack/objectql$': '<rootDir>/../../../../spec/packages/objectql/src',
        '^@objectql/types$': '<rootDir>/../../foundation/types/src',
        '^@objectql/core$': '<rootDir>/../../foundation/core/src',
        '^@objectql/driver-sql$': '<rootDir>/../../drivers/sql/src',
        '^@objectql/driver-mongo$': '<rootDir>/../../drivers/mongo/src',
        '^(.*)\\.js$': '$1',
    }
};
