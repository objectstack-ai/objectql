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
  testMatch: ['**/test/**/*.test.ts'],
  moduleNameMapper: {
    '^@objectstack/runtime$': '<rootDir>/../../../../spec/packages/runtime/src',
    '^@objectstack/core$': '<rootDir>/../../../../spec/packages/core/src',
    '^@objectstack/objectql$': '<rootDir>/../../../../spec/packages/objectql/src',
    '^@objectql/(.*)$': '<rootDir>/../$1/src',
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
  transformIgnorePatterns: [
    'node_modules/(?!(@objectstack))',
  ],
};
