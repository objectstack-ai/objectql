/**
 * ObjectQL - Core Performance Baseline
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { CompiledHookManager } from '../../packages/foundation/core/src/optimizations/CompiledHookManager';
import { PermissionLoader } from '../../packages/foundation/plugin-security/src/permission-loader';
import { PermissionGuard } from '../../packages/foundation/plugin-security/src/permission-guard';
import { MemoryDriver } from '../../packages/drivers/memory/src';
import type { PermissionConfig } from '@objectql/types';

type BenchmarkResult = {
  name: string;
  iterations: number;
  p50: number;
  p95: number;
  p99: number;
  mean: number;
};

const nowNs = () => Number(process.hrtime.bigint());

const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;
  const idx = Math.min(values.length - 1, Math.max(0, Math.floor(values.length * p)));
  return values[idx];
};

const summarize = (name: string, samplesNs: number[], iterations: number): BenchmarkResult => {
  const sorted = [...samplesNs].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  return {
    name,
    iterations,
    p50: percentile(sorted, 0.5) / 1_000_000,
    p95: percentile(sorted, 0.95) / 1_000_000,
    p99: percentile(sorted, 0.99) / 1_000_000,
    mean: mean / 1_000_000,
  };
};

const run = async (name: string, iterations: number, fn: () => Promise<void>): Promise<BenchmarkResult> => {
  const samples: number[] = [];
  for (let i = 0; i < Math.min(iterations, 100); i += 1) {
    await fn();
  }
  for (let i = 0; i < iterations; i += 1) {
    const start = nowNs();
    await fn();
    const end = nowNs();
    samples.push(end - start);
  }
  return summarize(name, samples, iterations);
};

const main = async () => {
  const results: BenchmarkResult[] = [];

  // Hook execution baseline
  const hookManager = new CompiledHookManager();
  for (let i = 0; i < 50; i += 1) {
    hookManager.registerHook('beforeCreate', 'accounts', async () => undefined);
  }
  results.push(
    await run('hooks.beforeCreate.p50', 2000, async () => {
      await hookManager.runHooks('beforeCreate', 'accounts', { record: { id: '1' } });
    }),
  );

  // Permission check baseline
  const permissionConfig: PermissionConfig = {
    object: 'accounts',
    object_permissions: {
      read: ['admin'],
      create: ['admin'],
      update: ['admin'],
      delete: ['admin'],
    },
  };
  const permissionLoader = new PermissionLoader({
    storageType: 'memory',
    permissions: [permissionConfig],
    precompileRules: true,
  });
  const permissionGuard = new PermissionGuard(permissionLoader, true, 10_000);

  results.push(
    await run('security.permission.read', 2000, async () => {
      await permissionGuard.checkObjectPermission(
        { objectName: 'accounts', operation: 'read', user: { id: 'u1', roles: ['admin'] } },
        'read',
      );
    }),
  );

  // Query execution baseline
  const driver = new MemoryDriver({
    initialData: {
      accounts: Array.from({ length: 2000 }).map((_, idx) => ({
        id: String(idx + 1),
        name: `Account ${idx + 1}`,
        status: idx % 2 === 0 ? 'active' : 'inactive',
      })),
    },
  });

  results.push(
    await run('query.find.status=active', 2000, async () => {
      await driver.find('accounts', {
        filters: [['status', '=', 'active']],
        top: 50,
      });
    }),
  );

  console.log('\nObjectQL Performance Baseline (ms)');
  console.table(results.map(r => ({
    name: r.name,
    iterations: r.iterations,
    p50: r.p50.toFixed(3),
    p95: r.p95.toFixed(3),
    p99: r.p99.toFixed(3),
    mean: r.mean.toFixed(3),
  })));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
