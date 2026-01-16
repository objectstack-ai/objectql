# GitHub Workflows Documentation

This document describes all the GitHub Actions workflows configured for the ObjectQL repository.

## Core CI/CD Workflows

### 🔨 [ci.yml](workflows/ci.yml)
**Purpose:** Main continuous integration pipeline  
**Triggers:** Push to `main`, Pull Requests  
**What it does:**
- Runs on Node.js 18.x and 20.x
- Installs dependencies with pnpm
- Builds all packages
- Runs test suite across all packages
- Sets up Redis and MongoDB for driver tests

### 📊 [coverage.yml](workflows/coverage.yml) ✨ NEW
**Purpose:** Test coverage tracking and reporting  
**Triggers:** Push to `main`, Pull Requests  
**What it does:**
- Runs tests with coverage collection
- Uploads coverage reports to Codecov
- Provides coverage insights on PRs
- Tracks coverage trends over time

### ✅ [typecheck.yml](workflows/typecheck.yml)
**Purpose:** TypeScript type checking  
**Triggers:** Push to `main`, Pull Requests  
**What it does:**
- Runs TypeScript compiler in build mode
- Ensures no type errors across the monorepo
- Fast feedback on type safety

## Release & Publishing

### 🚀 [release.yml](workflows/release.yml)
**Purpose:** Automated package publishing  
**Triggers:** Push to `main`  
**What it does:**
- Uses Changesets for version management
- Creates release PRs automatically
- Publishes packages to npm when merged
- Requires NPM_TOKEN secret

### 📝 [changelog-preview.yml](workflows/changelog-preview.yml) ✨ NEW
**Purpose:** Preview changelog before release  
**Triggers:** Pull Requests  
**What it does:**
- Shows what changes will be included in next release
- Reminds contributors to add changesets
- Comments on PRs with changelog preview

## Code Quality & Security

### 🔒 [codeql.yml](workflows/codeql.yml)
**Purpose:** Security scanning with CodeQL  
**Triggers:** Push to `main`, Pull Requests, Weekly schedule  
**What it does:**
- Scans JavaScript/TypeScript code for vulnerabilities
- Runs security analysis
- Creates security alerts for issues found

### 🔍 [dependency-review.yml](workflows/dependency-review.yml)
**Purpose:** Dependency security review  
**Triggers:** Pull Requests  
**What it does:**
- Reviews new/updated dependencies
- Checks for known vulnerabilities
- Fails on moderate or higher severity issues
- Comments on PRs with findings

### ✓ [validate-metadata.yml](workflows/validate-metadata.yml)
**Purpose:** Validate ObjectQL metadata files  
**Triggers:** Changes to `*.object.yml`, `*.validation.yml`, etc.  
**What it does:**
- Validates YAML syntax for metadata files
- Ensures metadata follows ObjectQL schema
- Prevents invalid metadata from being merged

## Documentation

### 📚 [deploy-docs.yml](workflows/deploy-docs.yml)
**Purpose:** Deploy documentation to GitHub Pages  
**Triggers:** Push to `main` (docs changes), Manual dispatch  
**What it does:**
- Builds VitePress documentation site
- Deploys to GitHub Pages
- Makes docs available at objectql.org

### 🔗 [link-checker.yml](workflows/link-checker.yml) ✨ NEW
**Purpose:** Check for broken links in documentation  
**Triggers:** Push/PR with doc changes, Weekly schedule, Manual  
**What it does:**
- Scans all Markdown files for links
- Checks if links are accessible
- Reports broken links
- Prevents dead links in documentation

## Repository Automation

### 🏷️ [labeler.yml](workflows/labeler.yml)
**Purpose:** Auto-label PRs based on files changed  
**Triggers:** Pull Requests (opened, synchronized, reopened)  
**What it does:**
- Adds labels like `📦 dependencies`, `🏗️ foundation`, `🔌 drivers`
- Based on file paths changed
- Helps with PR organization and filtering

### 📏 [pr-size-labeler.yml](workflows/pr-size-labeler.yml) ✨ NEW
**Purpose:** Label PRs by size  
**Triggers:** Pull Requests (opened, synchronized, reopened)  
**What it does:**
- Adds size labels: `size/XS`, `size/S`, `size/M`, `size/L`, `size/XL`
- XS: ≤10 lines, S: ≤50, M: ≤200, L: ≤500, XL: >500
- Ignores lock files and markdown
- Encourages smaller, reviewable PRs

### 👋 [welcome.yml](workflows/welcome.yml) ✨ NEW
**Purpose:** Welcome first-time contributors  
**Triggers:** First issue or PR from a new contributor  
**What it does:**
- Posts welcoming message on first issue
- Provides PR checklist for first-time contributors
- Links to documentation and guidelines

### 🗑️ [stale.yml](workflows/stale.yml)
**Purpose:** Manage stale issues and PRs  
**Triggers:** Daily schedule, Manual dispatch  
**What it does:**
- **Issues:** Mark stale after 60 days, close after 14 more days
- **PRs:** Mark stale after 30 days, close after 7 more days
- Exempts labeled issues: `pinned`, `security`, `roadmap`
- Helps keep issue tracker organized

### 🧹 [cleanup-runs.yml](workflows/cleanup-runs.yml) ✨ NEW
**Purpose:** Clean up old workflow runs  
**Triggers:** Weekly schedule (Sunday), Manual dispatch  
**What it does:**
- Deletes workflow runs older than 30 days
- Keeps minimum of 6 recent runs
- Saves storage space
- Reduces clutter

## Dependency Management

### 🤖 [auto-approve-dependabot.yml](workflows/auto-approve-dependabot.yml) ✨ NEW
**Purpose:** Streamline Dependabot PR approvals  
**Triggers:** Dependabot Pull Requests  
**What it does:**
- Auto-approves patch and minor version updates
- Comments on major version updates for review
- Speeds up dependency update process
- Still requires CI to pass before merge

## Performance Testing

### ⚡ [benchmark.yml](workflows/benchmark.yml) ✨ NEW
**Purpose:** Track performance benchmarks  
**Triggers:** Push to `main`, Pull Requests, Manual  
**What it does:**
- Runs benchmark scripts (if configured)
- Tracks performance over time
- Alerts on significant regressions
- Ready for when benchmarks are implemented

---

## Configuration Files

### [labeler.yml](labeler.yml)
Configuration for the PR auto-labeler, mapping file paths to labels.

### [markdown-link-check-config.json](markdown-link-check-config.json) ✨ NEW
Configuration for the link checker, including patterns to ignore (localhost, example.com).

---

## Required Secrets

The following secrets need to be configured in repository settings:

- `NPM_TOKEN` - For publishing packages to npm (required by release.yml)
- `CODECOV_TOKEN` - For uploading coverage reports (optional for coverage.yml)

---

## Workflow Status Badges

Add these badges to your README to show workflow status:

```markdown
[![CI](https://github.com/objectstack-ai/objectql/actions/workflows/ci.yml/badge.svg)](https://github.com/objectstack-ai/objectql/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/objectstack-ai/objectql/branch/main/graph/badge.svg)](https://codecov.io/gh/objectstack-ai/objectql)
[![Type Check](https://github.com/objectstack-ai/objectql/actions/workflows/typecheck.yml/badge.svg)](https://github.com/objectstack-ai/objectql/actions/workflows/typecheck.yml)
[![CodeQL](https://github.com/objectstack-ai/objectql/actions/workflows/codeql.yml/badge.svg)](https://github.com/objectstack-ai/objectql/actions/workflows/codeql.yml)
```

---

## Contributing

When contributing to ObjectQL:

1. **Write tests** - The CI workflow will run them
2. **Add a changeset** - Use `pnpm changeset` for user-facing changes
3. **Check types** - Run `pnpm tsc -b` locally
4. **Update docs** - If you change APIs or add features

The workflows will automatically:
- Run tests and type checks
- Label your PR by size and files changed
- Welcome you if it's your first contribution
- Preview the changelog
- Check for broken links in docs

---

**Legend:**
- ✨ NEW = Recently added workflows
- All workflows include proper timeouts and error handling
- All workflows are optimized for fast feedback
