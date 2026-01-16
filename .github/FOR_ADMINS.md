# For Organization Admins: Enable Release Workflow

**To**: Organization Owners of `objectstack-ai`  
**Subject**: Action Required - Enable GitHub Actions PR Creation  
**Priority**: Medium  
**Estimated Time**: 2 minutes

---

## What Happened?

The automated release workflow is currently failing because GitHub Actions doesn't have permission to create pull requests. This is controlled by a security setting that needs to be enabled.

**Error Message**:
```
GitHub Actions is not permitted to create or approve pull requests
```

**Failed Workflow**: https://github.com/objectstack-ai/objectql/actions/runs/21075340633/job/60615659715

---

## What Needs to Be Done?

You need to enable a checkbox in two places (takes ~2 minutes total):

### Step 1: Enable at Organization Level (You must do this first)

1. **Go to**: https://github.com/organizations/objectstack-ai/settings/actions
   
2. **Scroll down** to the "Workflow permissions" section

3. **Check the box**: 
   ```
   ☑ Allow GitHub Actions to create and approve pull requests
   ```

4. **Click** the "Save" button

### Step 2: Enable at Repository Level

1. **Go to**: https://github.com/objectstack-ai/objectql/settings/actions

2. **Scroll down** to the "Workflow permissions" section

3. **Check the box**: 
   ```
   ☑ Allow GitHub Actions to create and approve pull requests
   ```

4. **Click** the "Save" button

---

## Why Is This Safe?

✅ **Protected Branches**: Our `main` branch has protection rules that prevent unauthorized merges

✅ **Required Reviews**: PRs still require manual approval before merge

✅ **CI Checks Required**: All tests must pass before merge is allowed

✅ **Limited Scope**: The GitHub Actions token only has the permissions explicitly granted in workflow files

✅ **Audit Trail**: All PR creations by GitHub Actions are logged and visible

✅ **Trusted Actions**: We only use official actions from:
- `changesets/action` (official changesets maintainer)
- `actions/*` (official GitHub actions)
- `pnpm/*` (official pnpm maintainer)

---

## What Will This Enable?

Once enabled, the release workflow will:

1. **Automatically create** a "Version Packages" PR when changesets are detected
2. **Update** version numbers in package.json files
3. **Generate** CHANGELOG.md entries
4. **Publish** packages to npm when you manually merge the PR

You still maintain full control - the workflow only **creates** the PR. You **manually review and merge** it.

---

## What If I Don't Enable This?

- ❌ Automated releases won't work
- ⚠️ Maintainers will need to manually:
  - Run `pnpm changeset version`
  - Update all CHANGELOG.md files
  - Update all package.json versions
  - Publish to npm manually
  - Create GitHub releases manually

This increases maintenance burden and risk of human error.

---

## Verification

After enabling both settings, you can test by:

1. Merging a PR with a changeset to `main`
2. The workflow should automatically create a "Version Packages" PR
3. Check: https://github.com/objectstack-ai/objectql/pulls

---

## Questions?

**Documentation**:
- Quick Setup: [.github/RELEASE_CHECKLIST.md](.github/RELEASE_CHECKLIST.md)
- Detailed Guide: [.github/RELEASE_SETUP.md](.github/RELEASE_SETUP.md)

**GitHub Official Docs**:
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository

**Security Info**:
- https://github.blog/changelog/2022-05-03-github-actions-prevent-github-actions-from-creating-and-approving-pull-requests/

---

**Thank you for maintaining ObjectQL! 🚀**
