import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.js", "**/out/**", "**/generated/**", "**/*.d.ts", "**/templates/**"],
  },
  {
      rules: {
          "@typescript-eslint/no-explicit-any": "off",
          "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }],
          "@typescript-eslint/no-require-imports": "off",
          "@typescript-eslint/no-empty-object-type": "off",
          "no-case-declarations": "error",
          "no-useless-escape": "off",
          "prefer-const": "error",
          "no-empty": "warn",
          "no-undef": "off",
          "no-useless-catch": "error",
          "no-console": "warn",
          "@typescript-eslint/no-this-alias": "off",
          "@typescript-eslint/no-unsafe-function-type": "off"
      }
  },
  {
      // CLI and tools: console output is intentional for user-facing terminal output
      files: ["packages/tools/**/*.ts"],
      rules: {
          "no-console": "off"
      }
  },
  {
      // Logger implementation: console.* is the underlying transport
      files: ["packages/foundation/types/src/logger.ts"],
      rules: {
          "no-console": "off"
      }
  },
  {
      // SDK driver: logging is user-controlled via enableLogging flag
      files: ["packages/drivers/sdk/src/index.ts"],
      rules: {
          "no-console": "off"
      }
  },
  {
      // Test files: console output is acceptable for debugging and assertions
      files: ["**/*.test.ts", "**/*.spec.ts", "**/test/**/*.ts", "**/__tests__/**/*.ts", "**/__mocks__/**/*.ts"],
      rules: {
          "no-console": "off"
      }
  },
  {
      // Example files: console output for demonstration purposes
      files: ["examples/**/*.ts"],
      rules: {
          "no-console": "off"
      }
  }
);
