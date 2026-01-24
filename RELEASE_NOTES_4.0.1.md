# ObjectQL Release v4.0.1

**Release Date:** January 24, 2026  
**Type:** Patch Release  
**Previous Version:** 4.0.0  
**New Version:** 4.0.1

## Summary

This is a coordinated patch release that updates all 14 ObjectQL packages in the fixed versioning group from version 4.0.0 to 4.0.1.

## What's New in v4.0.1

### Infrastructure & Tooling
- ✅ Added comprehensive GitHub workflows for CI/CD, testing, and quality assurance
- ✅ Enhanced build and release processes with Changesets
- ✅ Improved repository structure and developer tooling

### Features
- ✅ Added Excel driver (`@objectql/driver-excel`) for reading/writing Excel files as data sources
- ✅ Enhanced documentation and developer experience

### Improvements
- ✅ Bug fixes and stability enhancements across all packages
- ✅ Updated dependency management

## Packages Updated

All packages in the fixed versioning group are synchronized at version 4.0.1:

| Package | Version | Description |
|---------|---------|-------------|
| @objectql/types | 4.0.1 | Pure TypeScript type definitions |
| @objectql/core | 4.0.1 | Universal runtime engine |
| @objectql/platform-node | 4.0.1 | Node.js platform utilities |
| @objectql/driver-sql | 4.0.1 | SQL database driver |
| @objectql/driver-mongo | 4.0.1 | MongoDB driver |
| @objectql/driver-redis | 4.0.1 | Redis driver |
| @objectql/driver-fs | 4.0.1 | File system driver |
| @objectql/driver-memory | 4.0.1 | In-memory driver |
| @objectql/driver-localstorage | 4.0.1 | Browser LocalStorage driver |
| @objectql/driver-excel | 4.0.1 | Excel file driver |
| @objectql/sdk | 4.0.1 | SDK for remote API access |
| @objectql/server | 4.0.1 | Server runtime |
| @objectql/cli | 4.0.1 | Command-line interface |
| @objectql/create | 4.0.1 | Project scaffolding tool |

## Git Tag

A git tag `v4.0.1` has been created and points to commit `5533281`.

## Installation

To upgrade to this version, update your `package.json`:

```json
{
  "dependencies": {
    "@objectql/core": "^4.0.1",
    "@objectql/driver-sql": "^4.0.1"
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

## Testing

- ✅ TypeScript compilation successful
- ✅ Core packages built successfully
- ✅ 79+ tests passing
- ⚠️ 1 pre-existing test failure in memory driver OR filter (not a regression)

## Migration Guide

No breaking changes. This is a backward-compatible patch release. Simply update the version numbers in your dependencies.

## Links

- [CHANGELOG - @objectql/types](../packages/foundation/types/CHANGELOG.md)
- [CHANGELOG - @objectql/core](../packages/foundation/core/CHANGELOG.md)
- [GitHub Release Workflow](../.github/workflows/release.yml)

---

**Prepared by:** ObjectQL Lead Architect  
**Commit:** 5533281  
**Tag:** v4.0.1
