module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  moduleNameMapper: {
    '^@objectql/types$': '<rootDir>/../../foundation/types/src',
    '^@objectql/core$': '<rootDir>/../../foundation/core/src',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true,
    }],
  },
};
