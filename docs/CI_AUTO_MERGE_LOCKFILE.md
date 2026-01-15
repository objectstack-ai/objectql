# Auto-Merge with Lockfile Fix - CI Script Solution

## Overview

This document explains the **Ultimate Automation Solution** for automatically resolving `pnpm-lock.yaml` conflicts during git merge operations in CI/CD environments.

## The Problem

When merging branches (e.g., Dependabot updates, feature branches), conflicts in `pnpm-lock.yaml` are common and can block automated workflows. Traditional solutions require modifying tracked repository files.

## The Solution: CI Script Approach

This approach **does NOT modify any tracked files** in your repository. Instead, it configures Git temporarily in the CI environment using two simple commands before running `git merge`.

### How It Works

```bash
# --- Step 1: Configure temporary merge driver ---
# Define a driver called pnpm-merge that runs pnpm install
git config merge.pnpm-merge.name "pnpm-lock.yaml merge driver"
git config merge.pnpm-merge.driver "pnpm install --no-frozen-lockfile"

# --- Step 2: Bind the strategy (KEY STEP) ---
# Temporarily tell Git: for pnpm-lock.yaml files, use the pnpm-merge driver
# Writing to .git/info/attributes only affects current CI environment,
# doesn't dirty your codebase
echo "pnpm-lock.yaml merge=pnpm-merge" >> .git/info/attributes

# --- Step 3: Merge as usual ---
# Now if lock file has conflicts, Git will auto-resolve them without errors
git merge origin/main
```

### Key Benefits

1. **✅ No Repository Changes**: Nothing gets committed to your codebase
2. **✅ CI-Only**: Configuration exists only in the CI environment
3. **✅ Automatic**: Lock file is regenerated automatically on conflict
4. **✅ Clean**: `.git/info/attributes` is never tracked by Git

## Implementation

### Option 1: Dependabot Auto-Merge

See `.github/workflows/auto-merge-dependabot.yml` for a complete example that:
- Automatically merges Dependabot PRs
- Resolves pnpm-lock.yaml conflicts
- Enables auto-merge on success

### Option 2: Manual Merge Workflow

See `.github/workflows/merge-with-lockfile-fix.yml` for a workflow_dispatch example that:
- Can be triggered manually
- Merges any branch with lockfile auto-fix
- Useful for release workflows

### Option 3: Add to Existing Workflow

Add this step before any `git merge` operation in your existing workflows:

```yaml
- name: Configure pnpm lockfile merge driver
  run: |
    git config merge.pnpm-merge.name "pnpm-lock.yaml merge driver"
    git config merge.pnpm-merge.driver "pnpm install --no-frozen-lockfile"
    echo "pnpm-lock.yaml merge=pnpm-merge" >> .git/info/attributes
```

## Comparison with Other Approaches

| Approach | Repository Changes | Persistent | CI-Only | Complexity |
|----------|-------------------|------------|---------|------------|
| **CI Script** (This) | ❌ None | ❌ No | ✅ Yes | Low |
| `.gitattributes` | ✅ Yes | ✅ Yes | ❌ No | Low |
| Setup Script | ✅ Yes | ✅ Yes | ❌ No | Medium |

## Technical Details

### Why `.git/info/attributes`?

- Located inside `.git/` directory (never tracked)
- Has the same syntax as `.gitattributes`
- Only affects the local Git repository
- Perfect for CI-specific configurations

### Why `--no-frozen-lockfile`?

The `--no-frozen-lockfile` flag allows pnpm to regenerate the lockfile if needed. This is essential for the merge driver to resolve conflicts by creating a new, consistent lockfile.

**Note:** The existing `scripts/setup-merge-driver.sh` uses just `pnpm install` without this flag. Both approaches work:
- `pnpm install` - Simpler, relies on pnpm's default behavior
- `pnpm install --no-frozen-lockfile` - Explicit, ensures lockfile can be updated

For CI environments, `--no-frozen-lockfile` is recommended to be explicit about the intent.

### Error Handling

If the merge fails for reasons other than lockfile conflicts, the workflow will:
1. Check if `pnpm-lock.yaml` is in conflict
2. If yes, regenerate and commit
3. If no, fail with an error (manual intervention needed)

## Testing

You can test this approach locally:

```bash
# Create a test scenario
git checkout -b test-merge-fix
# Make some changes and commit
git checkout main
# Configure the merge driver
git config merge.pnpm-merge.name "pnpm-lock.yaml merge driver"
git config merge.pnpm-merge.driver "pnpm install --no-frozen-lockfile"
echo "pnpm-lock.yaml merge=pnpm-merge" >> .git/info/attributes
# Try merging
git merge test-merge-fix
```

## References

- [Git Attributes Documentation](https://git-scm.com/docs/gitattributes)
- [Custom Merge Drivers](https://git-scm.com/docs/gitattributes#_defining_a_custom_merge_driver)
- [PNPM Lock File](https://pnpm.io/git#lockfiles)

## License

This solution is part of the ObjectQL project and follows the same MIT license.
