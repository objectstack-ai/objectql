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
          "@typescript-eslint/no-unused-vars": "off",
          "@typescript-eslint/no-require-imports": "off",
          "@typescript-eslint/no-empty-object-type": "off",
          "no-case-declarations": "off",
          "no-useless-escape": "off",
          "prefer-const": "off",
          "no-empty": "off",
          "no-undef": "off",
          "no-useless-catch": "off",
          "@typescript-eslint/no-this-alias": "off",
          "@typescript-eslint/no-unsafe-function-type": "off"
      }
  }
);
