# GitHub Workflows for ObjectQL

This directory contains automated workflows for the ObjectQL project.

## Auto-Merge Workflows

### 🔄 auto-merge-dependabot.yml

Automatically merges Dependabot pull requests with lockfile conflict resolution.

**Features:**
- Runs only for PRs created by `dependabot[bot]`
- Automatically resolves `pnpm-lock.yaml` conflicts using a temporary merge driver
- Enables GitHub's auto-merge feature after successful merge
- No permanent changes to repository configuration

**How it works:**
1. Configures a temporary merge driver in the CI environment
2. Uses `.git/info/attributes` (not tracked by Git) to apply the driver
3. Merges the base branch into the PR branch
4. Regenerates lockfile if conflicts are detected
5. Enables auto-merge for the PR

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
