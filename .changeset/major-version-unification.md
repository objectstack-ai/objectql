---
"@objectql/cli": major
"@objectql/core": major
"@objectql/create": major
"@objectql/driver-excel": major
"@objectql/driver-fs": major
"@objectql/driver-localstorage": major
"@objectql/driver-memory": major
"@objectql/driver-mongo": major
"@objectql/driver-redis": major
"@objectql/driver-sql": major
"@objectql/platform-node": major
"@objectql/sdk": major
"@objectql/server": major
"@objectql/types": major
---

**Major Release: Version 2.0.0 - Unified Package Versioning**

This is a coordinated major release that unifies all ObjectQL packages to version 2.0.0, establishing a synchronized versioning strategy across the entire ecosystem.

### 🎯 Key Changes

- **Unified Versioning**: All core packages now share the same version number (2.0.0)
- **Fixed Group Management**: Updated changeset configuration to include all @objectql packages in the fixed versioning group
- **Simplified Maintenance**: Future releases will automatically maintain version consistency across the entire monorepo

### 📦 Packages Included

All ObjectQL packages are now synchronized at version 2.0.0:
- Foundation: `@objectql/types`, `@objectql/core`, `@objectql/platform-node`
- Drivers: `@objectql/driver-sql`, `@objectql/driver-mongo`, `@objectql/driver-redis`, `@objectql/driver-fs`, `@objectql/driver-memory`, `@objectql/driver-localstorage`, `@objectql/driver-excel`, `@objectql/sdk`
- Runtime: `@objectql/server`
- Tools: `@objectql/cli`, `@objectql/create`

### ⚠️ Breaking Changes

This is marked as a major version due to the version number change. The API remains stable and backward compatible. No code changes are required when upgrading.

### 🔄 Migration

Simply update all `@objectql/*` packages to `^2.0.0` in your `package.json`:

```json
{
  "dependencies": {
    "@objectql/core": "^2.0.0",
    "@objectql/driver-sql": "^2.0.0"
  }
}
```

### 📝 Notes

This release establishes a foundation for coordinated major releases across the ObjectQL ecosystem, ensuring compatibility and simplifying dependency management for users.
