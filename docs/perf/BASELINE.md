# ObjectQL Performance Baseline (v1)

> Status: Draft (generated from scripts/benchmarks/core-perf.ts)

## Environment

- OS:
- CPU:
- Node.js:
- PNPM:
- Commit:
- Date:

## Method

- Script: scripts/benchmarks/core-perf.ts
- Iterations: 2000 per scenario (100 warmup)
- Metrics: p50 / p95 / p99 / mean (milliseconds)

## Results

| Scenario | p50 (ms) | p95 (ms) | p99 (ms) | mean (ms) |
|---|---:|---:|---:|---:|
| hooks.beforeCreate.p50 | TBD | TBD | TBD | TBD |
| security.permission.read | TBD | TBD | TBD | TBD |
| query.find.status=active | TBD | TBD | TBD | TBD |

## Notes

- Replace TBD after running: `pnpm bench:core`
- Aim for stable p95 under load before v1 release.
