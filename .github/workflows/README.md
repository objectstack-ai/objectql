# GitHub Workflows for ObjectQL

This directory contains automated workflows for the ObjectQL project.

## Auto-Merge Workflows

### 🔄 auto-merge-dependabot.yml

Enables GitHub's auto-merge feature for Dependabot pull requests.

**Features:**
- Runs only for PRs created by `dependabot[bot]`
- Enables auto-merge (squash) on the PR
- Relies on GitHub's merge queue and branch protection rules
- Delegtes merge conflict handling to GitHub or other workflows

**Note:** This workflow doesn't implement the lockfile fix itself. For automatic lockfile conflict resolution, you can:
1. Use the CI script approach in your CI workflow (see merge-with-lockfile-fix.yml)
2. Configure branch protection rules that require CI to pass
3. Use GitHub's merge queue feature

**How it works:**
1. Detects Dependabot PRs
2. Enables auto-merge with squash strategy
3. GitHub will merge the PR once all checks pass

### 🔧 merge-with-lockfile-fix.yml

A workflow_dispatch example for manual branch merging with lockfile auto-fix.

**Usage:**
1. Go to Actions → Merge with Lockfile Auto-fix
2. Click "Run workflow"
3. Enter source and target branches
4. The workflow will merge with automatic lockfile resolution

**Use cases:**
- Release branch merging
- Feature branch synchronization
- Any scenario requiring merge automation

## The CI Script Approach

Both workflows use the "CI Script Approach" for lockfile conflict resolution:

```bash
# Step 1: Configure merge driver
git config merge.pnpm-merge.name "pnpm-lock.yaml merge driver"
git config merge.pnpm-merge.driver "pnpm install --no-frozen-lockfile"

# Step 2: Bind to pnpm-lock.yaml (CI-only, not tracked)
echo "pnpm-lock.yaml merge=pnpm-merge" >> .git/info/attributes

# Step 3: Merge normally
git merge origin/main
```

**Key Benefits:**
- ✅ No repository files modified
- ✅ Configuration only exists in CI
- ✅ Automatic lockfile regeneration
- ✅ Clean git history

## Documentation

For detailed information, see [CI_AUTO_MERGE_LOCKFILE.md](../docs/CI_AUTO_MERGE_LOCKFILE.md)

## Other Workflows

- **ci.yml**: Main CI workflow for builds and tests
- **release.yml**: Automated npm package publishing
- **typecheck.yml**: TypeScript type checking
- **validate-metadata.yml**: ObjectQL metadata validation
- **deploy-docs.yml**: Documentation deployment to GitHub Pages
- **codeql.yml**: Security scanning with CodeQL
- **dependency-review.yml**: Dependency vulnerability checking
- **stale.yml**: Stale issue and PR management
- **labeler.yml**: Automatic PR labeling
