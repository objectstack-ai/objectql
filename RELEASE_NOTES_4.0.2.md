# ObjectQL Release v4.0.2

**Release Date:** January 27, 2026  
**Type:** Patch Release  
**Previous Version:** 4.0.1  
**New Version:** 4.0.2

## Summary

This is a coordinated patch release that updates all ObjectQL packages in the fixed versioning group from version 4.0.1 to 4.0.2.

## What's New in v4.0.2

### Improvements
- ✅ Infrastructure improvements and maintenance updates
- ✅ Enhanced stability and reliability
- ✅ Bug fixes and performance optimizations

## Packages Updated

All packages in the fixed versioning group are synchronized at version 4.0.2:

| Package | Version | Description |
|---------|---------|-------------|
| @objectql/types | 4.0.2 | Pure TypeScript type definitions |
| @objectql/core | 4.0.2 | Universal runtime engine |
| @objectql/platform-node | 4.0.2 | Node.js platform utilities |
| @objectql/driver-sql | 4.0.2 | SQL database driver |
| @objectql/driver-mongo | 4.0.2 | MongoDB driver |
| @objectql/driver-redis | 4.0.2 | Redis driver |
| @objectql/driver-fs | 4.0.2 | File system driver |
| @objectql/driver-memory | 4.0.2 | In-memory driver |
| @objectql/driver-localstorage | 4.0.2 | Browser LocalStorage driver |
| @objectql/driver-excel | 4.0.2 | Excel file driver |
| @objectql/sdk | 4.0.2 | SDK for remote API access |
| @objectql/server | 4.0.2 | Server runtime |
| @objectql/cli | 4.0.2 | Command-line interface |
| @objectql/create | 4.0.2 | Project scaffolding tool |

## Installation

To upgrade to this version, update your `package.json`:

```json
{
  "dependencies": {
    "@objectql/core": "^4.0.2",
    "@objectql/driver-sql": "^4.0.2"
  }
}
```

Then run:
```bash
pnpm install
# or
npm install
```

## Publishing to NPM

This release is ready to be published. To publish:

### Automated (via GitHub Actions)
1. Merge this PR to `main`
2. The `release.yml` workflow will automatically publish to npm

### Manual Publishing
```bash
# Build all packages
pnpm run build

# Publish to npm
pnpm changeset publish

# Push tags
git push --follow-tags
```

## Migration Guide

No breaking changes. This is a backward-compatible patch release. Simply update the version numbers in your dependencies.

## Links

- [CHANGELOG - @objectql/types](packages/foundation/types/CHANGELOG.md)
- [CHANGELOG - @objectql/core](packages/foundation/core/CHANGELOG.md)
- [GitHub Release Workflow](.github/workflows/release.yml)

---

**Prepared by:** ObjectQL Lead Architect  
**Version:** 4.0.2
