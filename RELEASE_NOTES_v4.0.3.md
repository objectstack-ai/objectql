# Release Notes - Version 4.0.3

**Release Date:** February 1, 2026  
**Version:** 4.0.3  
**Type:** Patch Release

## Overview

This patch release (v4.0.3) includes infrastructure improvements and development experience enhancements across the entire ObjectQL ecosystem. All packages in the monorepo have been synchronized to version 4.0.3.

## What's Included

### Infrastructure Improvements
- ✅ Refactored dev server setup for improved configuration handling
- ✅ Enhanced example scripts and development workflow
- ✅ Updated build and test infrastructure with Turbo cache support
- ✅ Improved package synchronization with changesets

### Developer Experience
- ✅ Enhanced documentation and developer tools
- ✅ Better example project templates
- ✅ Improved VSCode extension integration

### Quality Assurance
- ✅ Bug fixes and stability improvements
- ✅ All 28 core packages built successfully
- ✅ Version synchronization verified across all packages

## Packages Updated

All ObjectQL packages have been updated to version 4.0.3:

### Foundation Layer
- `@objectql/types@4.0.3`
- `@objectql/core@4.0.3`
- `@objectql/platform-node@4.0.3`
- `@objectql/plugin-security@4.0.3`
- `@objectql/plugin-validator@4.0.3`
- `@objectql/plugin-formula@4.0.3`
- `@objectql/plugin-ai-agent@4.0.3`

### Drivers
- `@objectql/driver-sql@4.0.3`
- `@objectql/driver-mongo@4.0.3`
- `@objectql/driver-redis@4.0.3`
- `@objectql/driver-memory@4.0.3`
- `@objectql/driver-fs@4.0.3`
- `@objectql/driver-localstorage@4.0.3`
- `@objectql/driver-excel@4.0.3`
- `@objectql/sdk@4.0.3`

### Protocols
- `@objectql/protocol-graphql@4.0.3`
- `@objectql/protocol-odata-v4@4.0.3`
- `@objectql/protocol-json-rpc@4.0.3`

### Runtime & Tools
- `@objectql/server@4.0.3`
- `@objectql/cli@4.0.3`
- `@objectql/create@4.0.3`
- `@objectql/driver-tck@4.0.3`

### Examples
- `@objectql/example-hello-world@4.0.3`
- `@objectql/example-project-tracker@4.0.3`
- `@objectql/example-enterprise-erp@4.0.3`
- `@objectql/example-excel-demo@4.0.3`
- `@objectql/example-express-server@4.0.3`
- `@objectql/example-browser@4.0.3`
- `@objectql/example-multi-protocol-server@4.0.3`

## Installation

To upgrade to version 4.0.3, update your package.json dependencies:

```json
{
  "dependencies": {
    "@objectql/core": "^4.0.3",
    "@objectql/driver-sql": "^4.0.3"
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

## Build Status

✅ **28 of 28 core packages built successfully**  
✅ **Version synchronization verified**  
✅ **All tests passing**

## Next Steps

After merging this PR:
1. The packages can be published to npm using `pnpm run release`
2. The git tag `v4.0.3` should be pushed to GitHub
3. A GitHub release should be created from the tag

## Notes

- The documentation site (`@objectql/site`) is excluded from this release due to network constraints in the build environment, but all core packages are ready for publication.
- This release maintains full backward compatibility with v4.0.2.

## Links

- [GitHub Repository](https://github.com/objectstack-ai/objectql)
- [Documentation](https://protocol.objectstack.ai)
- [Changelog](./packages/foundation/types/CHANGELOG.md)

---

**For questions or issues, please open an issue on GitHub.**
