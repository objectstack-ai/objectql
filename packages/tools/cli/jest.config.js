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
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@objectql/types$': '<rootDir>/../../foundation/types/src',
    '^@objectql/core$': '<rootDir>/../../foundation/core/src',
    '^@objectql/driver-sql$': '<rootDir>/../../drivers/sql/src',
    '^@objectql/driver-mongo$': '<rootDir>/../../drivers/mongo/src',
    '^@objectql/sdk$': '<rootDir>/../../drivers/sdk/src',
    '^@objectql/platform-node$': '<rootDir>/../../foundation/platform-node/src',
    '^@objectql/server$': '<rootDir>/../../runtime/server/src',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true,
    }],
  },
};
