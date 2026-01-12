module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    moduleNameMapper: {
        '^@objectql/types$': '<rootDir>/../../foundation/types/src',
        '^@objectql/core$': '<rootDir>/../../foundation/core/src',
        '^@objectql/driver-sql$': '<rootDir>/../../drivers/sql/src',
        '^@objectql/driver-mongo$': '<rootDir>/../../drivers/mongo/src'
    }
};
