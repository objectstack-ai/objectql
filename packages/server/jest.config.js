module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    moduleNameMapper: {
        '^@objectql/(.*)$': '<rootDir>/../$1/src'
    }
};
