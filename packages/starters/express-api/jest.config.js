module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@objectql/core$': '<rootDir>/../../foundation/core/src',
    '^@objectql/types$': '<rootDir>/../../foundation/types/src',
    '^@objectql/platform-node$': '<rootDir>/../../foundation/platform-node/src',
    '^@objectql/driver-sql$': '<rootDir>/../../drivers/sql/src',
    '^@objectql/driver-mongo$': '<rootDir>/../../drivers/mongo/src',
    '^@objectql/server$': '<rootDir>/../../runtime/server/src',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      isolatedModules: true,
    }],
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
