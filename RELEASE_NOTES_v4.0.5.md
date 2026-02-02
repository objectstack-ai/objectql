# Release Notes - Version 4.0.5

**Release Date:** February 2, 2026  
**Version:** 4.0.5  
**Type:** Patch Release

## Overview

This patch release (v4.0.5) includes bug fixes and stability improvements across the ObjectQL ecosystem. All packages in the monorepo have been synchronized to version 4.0.5.

## What's New

### Bug Fixes & Stability Improvements

- ✅ General bug fixes and stability improvements
- ✅ Enhanced reliability across all packages
- ✅ Minor performance optimizations

## Packages Updated

All ObjectQL packages have been updated to version 4.0.5:

### Foundation Layer
- `@objectql/types@4.0.5` - Core type definitions
- `@objectql/core@4.0.5` - Core engine
- `@objectql/platform-node@4.0.5` - Node.js platform utilities
- `@objectql/plugin-security@4.0.5` - Security plugin
- `@objectql/plugin-validator@4.0.5` - Validation plugin
- `@objectql/plugin-formula@4.0.5` - Formula plugin
- `@objectql/plugin-ai-agent@4.0.5` - AI agent plugin

### Drivers
- `@objectql/driver-sql@4.0.5` - SQL database driver
- `@objectql/driver-mongo@4.0.5` - MongoDB driver
- `@objectql/driver-redis@4.0.5` - Redis driver
- `@objectql/driver-memory@4.0.5` - In-memory driver
- `@objectql/driver-fs@4.0.5` - File system driver
- `@objectql/driver-localstorage@4.0.5` - LocalStorage driver
- `@objectql/driver-excel@4.0.5` - Excel driver
- `@objectql/driver-utils@4.0.5` - Driver utilities
- `@objectql/sdk@4.0.5` - Remote HTTP driver/SDK

### Protocols
- `@objectql/protocol-graphql@4.0.5` - GraphQL protocol
- `@objectql/protocol-odata-v4@4.0.5` - OData v4 protocol
- `@objectql/protocol-json-rpc@4.0.5` - JSON-RPC protocol
- `@objectql/protocol-rest@4.0.6` - REST protocol
- `@objectql/protocol-tck@4.0.5` - Protocol TCK

### Tools
- `@objectql/cli@4.0.5` - Command-line interface
- `@objectql/create@4.0.5` - Project scaffolding tool
- `@objectql/driver-tck@4.0.5` - Driver TCK

### Examples
- All example packages updated to v4.0.5

## Installation

To upgrade to version 4.0.5, update your package.json dependencies:

```json
{
  "dependencies": {
    "@objectql/core": "^4.0.5",
    "@objectql/driver-sql": "^4.0.5"
  }
}
```

Then run:
```bash
npm install
# or
pnpm install
# or
yarn install
```

## Migration Guide

This is a **patch release** with no breaking changes. Simply update your package versions and reinstall dependencies.

## Breaking Changes

None. This release maintains full backward compatibility with v4.0.4.

## Upgrade Recommendations

We recommend all users upgrade to v4.0.5 to benefit from bug fixes and stability improvements.

## Links

- [GitHub Repository](https://github.com/objectstack-ai/objectql)
- [Documentation](https://protocol.objectstack.ai)
- [Changelog](./packages/foundation/types/CHANGELOG.md)

---

**For questions or issues, please open an issue on GitHub.**
