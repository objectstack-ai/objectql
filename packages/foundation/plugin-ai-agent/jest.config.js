const baseConfig = require('../../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  displayName: '@objectql/plugin-ai-agent',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  moduleNameMapper: {
    '^@objectql/types$': '<rootDir>/../types/src',
    '^@objectql/plugin-validator$': '<rootDir>/../plugin-validator/src',
  }
};
