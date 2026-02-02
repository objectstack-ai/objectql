# Migration Guide: v0.9.0 Plugin Updates

This guide covers the changes made to ObjectQL plugins to align with `@objectstack/spec` v0.9.0.

## Overview

All ObjectQL plugins have been updated to:
1. Use `@objectstack/spec` v0.9.0 role definitions
2. Implement Zod validation for configuration
3. Use structured logging from `@objectstack/core`

## Breaking Changes

### 1. Configuration Validation

All plugin configurations are now validated using Zod schemas at runtime. Invalid configurations will throw validation errors immediately upon plugin instantiation.

**Before:**
```typescript
const securityPlugin = new ObjectQLSecurityPlugin({
  enabled: true,
  storageType: 'memory',
  cacheTTL: 60000
});
```

**After:**
```typescript
import { SecurityPluginConfigSchema } from '@objectql/plugin-security';

const securityPlugin = new ObjectQLSecurityPlugin({
  enabled: true,
  storageType: 'memory',
  cacheTTL: 60000 // Will be validated by Zod schema
});

// Configuration is automatically validated
// Invalid values will throw ZodError
```

### 2. Role Type Definitions

The `@objectql/plugin-security` now imports the `Role` type from `@objectstack/spec/auth` instead of defining it locally.

**Before:**
```typescript
// Role was implicitly defined as string[]
const permissions = {
  roles: ['admin', 'manager']
};
```

**After:**
```typescript
import type { Role } from '@objectql/plugin-security';

// Role now follows @objectstack/spec convention
// Role names MUST be lowercase snake_case
const permissions = {
  roles: ['admin', 'manager', 'sales_manager']
};
```

**Important:** Role names MUST follow the snake_case naming convention to prevent security issues.

### 3. Logging Changes

All plugins now use structured logging instead of console.log/error.

**Before:**
```typescript
// Plugins logged to console
console.log('[plugin-security] Installing...');
```

**After:**
```typescript
// Plugins use structured logger
logger.info('Installing security plugin', { 
  config: { enabled: true } 
});
```

This enables:
- Structured log entries with metadata
- Configurable log levels
- Better integration with observability tools
- Consistent logging format across all plugins

## Plugin-Specific Changes

### @objectql/plugin-security

**New Exports:**
```typescript
export { 
  SecurityPluginConfigSchema,
  PermissionStorageTypeSchema,
  DatabaseConfigSchema 
} from '@objectql/plugin-security';
```

**Updated Dependencies:**
```json
{
  "@objectstack/core": "^0.9.0",
  "@objectstack/spec": "^0.9.0",
  "zod": "^3.23.8"
}
```

### @objectql/plugin-validator

**New Exports:**
```typescript
export { ValidatorPluginConfigSchema } from '@objectql/plugin-validator';
```

**Configuration Changes:**
- `languageFallback` is now an array of strings: `string[]` instead of `string`
- Default value changed from `'en'` to `['en', 'zh-CN']`

**Before:**
```typescript
const validator = new ValidatorPlugin({
  language: 'en',
  languageFallback: 'zh-CN' // string
});
```

**After:**
```typescript
const validator = new ValidatorPlugin({
  language: 'en',
  languageFallback: ['zh-CN', 'en'] // string[]
});
```

### @objectql/plugin-formula

**New Exports:**
```typescript
export { FormulaPluginConfigSchema } from '@objectql/plugin-formula';
```

**Configuration Changes:**
- Added new configuration options for caching and validation
- `strict`, `timeout`, and `customFunctions` are now available

**New Options:**
```typescript
const formula = new FormulaPlugin({
  strict: true,
  timeout: 1000,
  enableCache: false,
  cacheTTL: 60000,
  autoEvaluateOnQuery: true
});
```

## Migration Steps

### Step 1: Update Dependencies

Update your `package.json` to use the latest plugin versions:

```json
{
  "dependencies": {
    "@objectql/plugin-security": "^4.0.5",
    "@objectql/plugin-validator": "^4.0.5",
    "@objectql/plugin-formula": "^4.0.5"
  }
}
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Update Plugin Configurations

Review and update your plugin configurations to ensure they conform to the new Zod schemas.

**Security Plugin:**
```typescript
import { ObjectQLSecurityPlugin } from '@objectql/plugin-security';

const securityPlugin = new ObjectQLSecurityPlugin({
  enabled: true,
  storageType: 'memory',
  permissions: [...],
  exemptObjects: [],
  enableRowLevelSecurity: true,
  enableFieldLevelSecurity: true,
  precompileRules: true,
  enableCache: true,
  cacheTTL: 60000,
  throwOnDenied: true,
  enableAudit: false
});
```

**Validator Plugin:**
```typescript
import { ValidatorPlugin } from '@objectql/plugin-validator';

const validatorPlugin = new ValidatorPlugin({
  language: 'en',
  languageFallback: ['en', 'zh-CN'], // Note: array now
  enableQueryValidation: true,
  enableMutationValidation: true
});
```

**Formula Plugin:**
```typescript
import { FormulaPlugin } from '@objectql/plugin-formula';

const formulaPlugin = new FormulaPlugin({
  strict: true,
  timeout: 1000,
  enableCache: false,
  cacheTTL: 60000,
  autoEvaluateOnQuery: true
});
```

### Step 4: Update Role Names

Ensure all role names follow the lowercase snake_case convention:

**Before:**
```typescript
const permissions = {
  object_permissions: {
    read: ['Admin', 'SalesManager'] // Invalid!
  }
};
```

**After:**
```typescript
const permissions = {
  object_permissions: {
    read: ['admin', 'sales_manager'] // Valid
  }
};
```

### Step 5: Test Your Application

Run your tests to ensure everything works correctly:

```bash
pnpm test
```

## Benefits of These Changes

1. **Type Safety**: Zod validation ensures configuration errors are caught early
2. **Better Observability**: Structured logging enables better monitoring and debugging
3. **Spec Compliance**: Alignment with `@objectstack/spec` ensures consistency across the ecosystem
4. **Security**: Role naming conventions prevent common security pitfalls
5. **Developer Experience**: Better error messages and validation feedback

## Troubleshooting

### ZodError on Plugin Initialization

If you see a `ZodError`, check your configuration against the schema:

```typescript
import { SecurityPluginConfigSchema } from '@objectql/plugin-security';

// Validate your config manually
const result = SecurityPluginConfigSchema.safeParse(yourConfig);
if (!result.success) {
  console.error('Configuration errors:', result.error.format());
}
```

### Role Name Validation Errors

Ensure all role names are lowercase and use underscores:
- ✅ `admin`, `sales_manager`, `ceo`, `region_east_vp`
- ❌ `Admin`, `SalesManager`, `CEO`, `Region East VP`

### Missing Dependencies

If you see import errors, ensure all dependencies are installed:

```bash
pnpm install @objectstack/core@^0.9.0 @objectstack/spec@^0.9.0 zod@^3.23.8
```

## Support

For questions or issues, please:
1. Check the [GitHub Issues](https://github.com/objectstack-ai/objectql/issues)
2. Review the [API Documentation](https://objectql.dev)
3. Join our [Discord Community](https://discord.gg/objectstack)
