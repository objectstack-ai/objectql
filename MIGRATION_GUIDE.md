# Migration Guide: Formula and Validator Plugin Refactoring

## Overview

Starting from version 4.0.2, the formula engine and validator have been split from `@objectql/core` into separate plugin packages:

- `@objectql/plugin-formula` - Formula engine functionality
- `@objectql/plugin-validator` - Validation engine functionality

This change improves modularity and allows applications to include only the features they need.

## What Changed

### Package Structure

**Before (v4.0.1 and earlier):**
```
@objectql/core
  ├── FormulaEngine
  ├── FormulaPlugin
  ├── Validator
  └── ValidatorPlugin
```

**After (v4.0.2+):**
```
@objectql/plugin-formula
  ├── FormulaEngine
  └── FormulaPlugin

@objectql/plugin-validator
  ├── Validator
  └── ValidatorPlugin

@objectql/core
  └── [re-exports above for backward compatibility]
```

### Breaking Changes

**None for most users!** The `@objectql/core` package continues to re-export these components for backward compatibility.

## Migration Path

### Option 1: No Changes Required (Recommended for Quick Migration)

If you're currently importing from `@objectql/core`, your code will continue to work without changes:

```typescript
// This still works!
import { FormulaEngine, Validator } from '@objectql/core';
```

### Option 2: Use New Packages (Recommended for New Code)

For better tree-shaking and explicit dependencies, update your imports:

**Before:**
```typescript
import { FormulaEngine, FormulaPlugin } from '@objectql/core';
import { Validator, ValidatorPlugin } from '@objectql/core';
```

**After:**
```typescript
import { FormulaEngine, FormulaPlugin } from '@objectql/plugin-formula';
import { Validator, ValidatorPlugin } from '@objectql/plugin-validator';
```

### Installing the New Packages

If you want to use the new packages directly:

```bash
pnpm add @objectql/plugin-formula @objectql/plugin-validator
```

Or with npm:

```bash
npm install @objectql/plugin-formula @objectql/plugin-validator
```

## Benefits of the New Structure

1. **Better Modularity**: Install only what you need
2. **Smaller Bundle Size**: Tree-shaking works better with separate packages
3. **Independent Versioning**: Plugins can be updated independently
4. **Clearer Dependencies**: Explicit about which features your app uses
5. **Consistent Architecture**: Follows the same pattern as `@objectql/plugin-security`

## Usage Examples

### Using Formula Plugin

```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { FormulaPlugin } from '@objectql/plugin-formula';

const kernel = new ObjectStackKernel([
  myApp,
  new FormulaPlugin({
    enable_cache: false,
    sandbox: { enabled: true }
  })
]);

await kernel.start();
```

### Using Validator Plugin

```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { ValidatorPlugin } from '@objectql/plugin-validator';

const kernel = new ObjectStackKernel([
  myApp,
  new ValidatorPlugin({
    language: 'en',
    languageFallback: ['en', 'zh-CN']
  })
]);

await kernel.start();
```

### Using Both Plugins

```typescript
import { ObjectStackKernel } from '@objectstack/runtime';
import { FormulaPlugin } from '@objectql/plugin-formula';
import { ValidatorPlugin } from '@objectql/plugin-validator';

const kernel = new ObjectStackKernel([
  myApp,
  new ValidatorPlugin(),
  new FormulaPlugin()
]);

await kernel.start();
```

## TypeScript Types

All TypeScript types remain unchanged and are still exported from `@objectql/types`:

```typescript
import type {
  FormulaContext,
  FormulaEvaluationResult,
  ValidationContext,
  ValidationResult
} from '@objectql/types';
```

## Testing

All existing tests have been migrated to the new packages and continue to pass. The test coverage remains the same:

- **Formula Tests**: 109 tests across 4 test suites
- **Validator Tests**: 52 tests across 3 test suites
- **Core Tests**: 121 tests across 7 test suites

## Deprecation Timeline

- **v4.0.2**: Re-exports added to `@objectql/core` for backward compatibility
- **v5.0.0**: Re-exports will be removed (planned)

We recommend migrating to the new packages at your convenience before v5.0.0.

## Support

If you encounter any issues during migration:

1. Check the [GitHub Issues](https://github.com/objectstack-ai/objectql/issues)
2. Review the [API Documentation](../../docs/api/)
3. Open a new issue if needed

## Additional Resources

- [Formula Plugin README](../packages/foundation/plugin-formula/README.md)
- [Validator Plugin README](../packages/foundation/plugin-validator/README.md)
- [API Documentation](../../docs/api/)
- [Examples](../../examples/)
