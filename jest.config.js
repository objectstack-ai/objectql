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
