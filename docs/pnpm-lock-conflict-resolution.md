# pnpm Lock File Merge Conflict Resolution

## Problem

When multiple developers work on the same repository and modify dependencies in parallel, merging branches often results in conflicts in the `pnpm-lock.yaml` file. These conflicts can be tedious to resolve manually.

## Solution

This repository uses an **automated conflict resolution strategy** for `pnpm-lock.yaml`:

1. **Union Merge Strategy**: Git automatically combines both versions of the lockfile
2. **Post-Merge Hook**: Automatically runs `pnpm install` after merges to regenerate a valid lockfile
3. **Version Enforcement**: The repository requires `pnpm >= 10.0.0` to ensure consistency

## How It Works

The solution uses Git's built-in `union` merge strategy combined with a post-merge hook:

1. **`.gitattributes`**: Configures pnpm-lock.yaml to use union merge (combines both sides)
2. **`.git/hooks/post-merge`**: Automatically runs `pnpm install` after any merge that touches pnpm-lock.yaml
3. **`package.json`**: Enforces pnpm version consistency across all developers

## Setup Instructions

### For Developers

After cloning this repository, run the setup script once:

```bash
./scripts/setup-merge-driver.sh
```

This will:
- Create a post-merge Git hook that auto-runs `pnpm install` after merges
- Display helpful information about how the system works

### What Happens During a Merge?

When you merge a branch that has changes in `pnpm-lock.yaml`:

1. Git uses the `union` strategy to combine both versions of the lockfile
2. The merge completes without stopping for manual conflict resolution
3. The post-merge hook automatically runs `pnpm install --no-frozen-lockfile`
4. pnpm regenerates a correct lockfile based on all package.json files
5. You review the changes and commit if needed

### Example Workflow

```bash
# Start merging a branch
git merge feature-branch

# Git automatically:
# 1. ✅ Combines both versions of pnpm-lock.yaml
# 2. ✅ Completes the merge
# 3. ✅ Runs pnpm install automatically (via post-merge hook)

# You see:
# 📦 pnpm-lock.yaml was updated in merge, running pnpm install...
# ✅ Dependencies synchronized

# Review the changes
git status
git diff pnpm-lock.yaml

# If pnpm-lock.yaml was modified by pnpm install, commit it
git add pnpm-lock.yaml
git commit -m "chore: update pnpm-lock.yaml after merge"
```

### Important Notes

⚠️ **Prerequisites:**
- You must have `pnpm` installed and available in your PATH
- The repository enforces `pnpm >= 10.0.0` (see `package.json` engines field)
- Run `./scripts/setup-merge-driver.sh` once after cloning

⚠️ **Package.json Conflicts:**
- If there are conflicts in `package.json` files, you must resolve those manually **first**
- After resolving package.json conflicts, run `pnpm install` manually
- Then complete the merge

⚠️ **Review After Merge:**
- Always review the regenerated `pnpm-lock.yaml` to ensure dependencies are correct
- The post-merge hook will remind you to review and commit changes
- Run tests after merging to verify everything works as expected

## Manual Resolution (Fallback)

If you prefer manual resolution or if the automatic process fails:

1. Resolve any `package.json` conflicts first
2. Run `pnpm install` to regenerate the lockfile:
   ```bash
   pnpm install --no-frozen-lockfile
   ```
3. Stage and commit the regenerated lockfile:
   ```bash
   git add pnpm-lock.yaml
   git commit -m "chore: regenerate pnpm-lock.yaml"
   ```

## Version Consistency

To prevent lockfile conflicts caused by different pnpm versions, this repository:

- Specifies `packageManager: "pnpm@10.0.0"` in `package.json`
- Requires `pnpm >= 10.0.0` in the `engines` field
- Uses `pnpm@10` in GitHub Actions CI

All developers should use the same major version of pnpm. Consider using [Corepack](https://nodejs.org/api/corepack.html) to automatically use the correct pnpm version:

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
```

## Troubleshooting

### "pnpm is not installed"

Install pnpm globally:

```bash
npm install -g pnpm@10
```

Or use Corepack:

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
```

### Post-merge hook not running

1. Verify the hook is installed and executable:
   ```bash
   ls -la .git/hooks/post-merge
   ```

2. Re-run the setup script:
   ```bash
   ./scripts/setup-merge-driver.sh
   ```

3. Make sure you're using `git merge` (hooks don't run with some Git GUI tools)

### pnpm install fails after merge

1. Check that you have no `package.json` conflicts remaining:
   ```bash
   git status
   ```

2. Resolve any package.json conflicts manually

3. Run `pnpm install` manually:
   ```bash
   pnpm install --no-frozen-lockfile
   ```

4. Complete the merge:
   ```bash
   git add pnpm-lock.yaml
   git commit
   ```

### Want to disable automatic pnpm install?

If you prefer to run `pnpm install` manually after merges:

```bash
rm .git/hooks/post-merge
```

The union merge strategy will still work, you'll just need to run `pnpm install` yourself.

## CI/CD Integration

The GitHub Actions workflows in this repository already use pnpm@10 consistently. No additional CI configuration is needed.

## How This Compares to Other Solutions

| Approach | Pros | Cons |
|----------|------|------|
| **Union merge + hook** (This repo) | ✅ Simple<br>✅ Reliable<br>✅ No custom code<br>✅ Works with all Git tools | ⚠️ Requires one-time setup<br>⚠️ May need manual commit |
| **Custom merge driver** | ✅ Fully automatic | ❌ Complex<br>❌ Hard to debug<br>❌ May fail silently |
| **Manual resolution** | ✅ Full control | ❌ Tedious<br>❌ Error-prone<br>❌ Slows down workflow |
| **Always use ours/theirs** | ✅ Never blocks | ❌ Loses changes<br>❌ Must always regenerate |

## References

- [pnpm - Working with Git](https://pnpm.io/git)
- [Git Attributes - Merge Strategies](https://git-scm.com/docs/gitattributes#_built_in_merge_drivers)
- [Git Hooks - post-merge](https://git-scm.com/docs/githooks#_post_merge)
