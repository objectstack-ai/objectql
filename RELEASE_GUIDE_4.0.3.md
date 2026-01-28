# ObjectQL v4.0.3 Release Guide

## 📦 Release Prepared

This branch contains ObjectQL version **4.0.3**, ready for release.

## ✅ Pre-Release Checklist

- [x] Version bumped from 4.0.2 to 4.0.3
- [x] All 14 packages synchronized at 4.0.3
- [x] CHANGELOGs updated for all packages
- [x] Build successful (19 packages)
- [x] Tests passing (318 tests)
- [x] Version consistency verified
- [x] Release notes created
- [x] Code review completed (no issues)
- [x] Security scan completed (no issues)

## 🚀 How to Release

### Option 1: Automated Release via GitHub (Recommended)

1. **Merge this PR to `main`**
   ```bash
   # The PR will be merged through GitHub UI
   ```

2. **GitHub Actions automatically:**
   - Builds all packages
   - Runs test suites
   - Publishes to npm registry
   - Creates git tag `v4.0.3`
   - Generates GitHub release

### Option 2: Manual Release

If you need to release manually:

```bash
# 1. Ensure you're on the release branch
git checkout copilot/release-new-version

# 2. Build all packages
pnpm run build

# 3. Login to npm (if not already logged in)
npm login

# 4. Publish all packages
pnpm changeset publish

# 5. Push tags to GitHub
git push --follow-tags
```

## 📚 Documentation

- **[RELEASE_NOTES_4.0.3.md](./RELEASE_NOTES_4.0.3.md)** - User-facing release notes
- **[VERSION_4.0.3_SUMMARY.md](./VERSION_4.0.3_SUMMARY.md)** - Technical release summary

## 🔍 What Changed

### Version Updates
All packages updated from `4.0.2` to `4.0.3`:

```json
{
  "dependencies": {
    "@objectql/core": "^4.0.3",
    "@objectql/driver-sql": "^4.0.3",
    "@objectql/cli": "^4.0.3"
  }
}
```

### Improvements
- Enhanced metadata handling and object retrieval logic
- Improved package configurations across all drivers
- Infrastructure improvements and maintenance updates
- Bug fixes and performance optimizations

## 🧪 Test Results

```
✅ @objectql/types:  36 tests passed
✅ @objectql/core:   282 tests passed
✅ Total:            318 tests passed
```

## 📦 Packages Included

| Package | Version | Status |
|---------|---------|--------|
| @objectql/types | 4.0.3 | ✅ Ready |
| @objectql/core | 4.0.3 | ✅ Ready |
| @objectql/platform-node | 4.0.3 | ✅ Ready |
| @objectql/driver-sql | 4.0.3 | ✅ Ready |
| @objectql/driver-mongo | 4.0.3 | ✅ Ready |
| @objectql/driver-redis | 4.0.3 | ✅ Ready |
| @objectql/driver-fs | 4.0.3 | ✅ Ready |
| @objectql/driver-memory | 4.0.3 | ✅ Ready |
| @objectql/driver-localstorage | 4.0.3 | ✅ Ready |
| @objectql/driver-excel | 4.0.3 | ✅ Ready |
| @objectql/sdk | 4.0.3 | ✅ Ready |
| @objectql/server | 4.0.3 | ✅ Ready |
| @objectql/cli | 4.0.3 | ✅ Ready |
| @objectql/create | 4.0.3 | ✅ Ready |

## 🔐 Security

- ✅ Code review: No issues found
- ✅ CodeQL analysis: No vulnerabilities detected
- ✅ No dependencies with known vulnerabilities

## 📝 Migration Guide

This is a backward-compatible patch release. To upgrade:

```bash
# Update package.json
npm install @objectql/core@^4.0.3

# Or with pnpm
pnpm add @objectql/core@^4.0.3
```

No code changes required.

## 🎯 Post-Release Verification

After publishing, verify the release:

```bash
# Check npm registry
npm view @objectql/core version
# Should show: 4.0.3

# Check git tags
git tag -l "v4.0.3"
# Should exist

# Verify installation
npm install @objectql/core@4.0.3
```

## 📞 Support

If you encounter any issues with this release:
- Check [RELEASE_NOTES_4.0.3.md](./RELEASE_NOTES_4.0.3.md)
- Review [VERSION_4.0.3_SUMMARY.md](./VERSION_4.0.3_SUMMARY.md)
- Open an issue on GitHub

---

**Release Prepared By:** ObjectQL Lead Architect  
**Release Date:** January 28, 2026  
**Release Type:** Patch Release  
**Status:** ✅ Ready for Production
