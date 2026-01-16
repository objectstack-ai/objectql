# Workflow Enhancement Opportunities

This document tracks potential future improvements for GitHub workflows.

## Low Priority Enhancements

### 1. Replace Third-Party Actions with GitHub Script

Some workflows currently use third-party actions that could be replaced with `actions/github-script@v7` for improved security and reduced external dependencies:

#### pr-size-labeler.yml
- **Current:** Uses `codelytv/pr-size-labeler@v1`
- **Status:** CodelyTV is a reputable organization, action works well
- **Future:** Could implement with github-script (~50 lines)
- **Benefit:** One less external dependency
- **Priority:** Low (current solution is secure and well-maintained)

#### changelog-preview.yml
- **Current:** Uses `thollander/actions-comment-pull-request@v2`
- **Status:** Popular action, widely used in ecosystem
- **Future:** Could use github-script for commenting
- **Benefit:** One less external dependency
- **Priority:** Low (current solution is simple and reliable)

#### benchmark.yml
- **Current:** Uses `benchmark-action/github-action-benchmark@v1`
- **Status:** Specialized benchmark tool with historical tracking
- **Future:** Custom implementation would be complex (100+ lines)
- **Benefit:** Full control over benchmark storage/comparison
- **Priority:** Very Low (current solution provides features that would be hard to replicate)

### 2. Coverage Integration Enhancements

- **Current:** Basic Codecov integration
- **Future Options:**
  - Add coverage badges to README
  - Set minimum coverage thresholds
  - Block PRs that decrease coverage
  - Generate coverage reports as PR comments

### 3. Benchmark Integration

- **Current:** Infrastructure ready but no benchmarks implemented
- **Future:**
  - Add benchmark scripts to key packages
  - Define performance budgets
  - Alert on regressions

### 4. Advanced PR Automation

- **Future Ideas:**
  - Auto-assign reviewers based on files changed
  - Auto-label based on commit message keywords
  - Integration with project boards
  - Automatic milestone assignment

## Security Considerations

All current third-party actions:
- ✅ Are from reputable sources
- ✅ Have limited permissions
- ✅ Handle non-sensitive operations
- ✅ Don't have write access to code
- ✅ Are properly scoped with explicit permissions

## Maintenance Notes

- Review third-party action versions quarterly
- Monitor for security advisories
- Consider migration to github-script if:
  - Action becomes unmaintained
  - Security vulnerability is discovered
  - Significant breaking changes occur

## Implementation Priority

1. **High:** None currently
2. **Medium:** Coverage enhancements, Benchmark implementation
3. **Low:** Replace third-party actions with github-script

---

*Last Updated: 2026-01-15*
*Next Review: 2026-04-15*
