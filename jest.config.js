/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  projects: [
    '<rootDir>/packages/foundation/*',
    '<rootDir>/packages/drivers/*',
    '<rootDir>/packages/runtime/*',
    '<rootDir>/packages/tools/cli',
    '<rootDir>/packages/tools/vscode-objectql',
    '<rootDir>/examples/showcase/*'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '<rootDir>/packages/tools/create/'
  ]
};
