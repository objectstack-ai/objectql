/**
 * ObjectQL — Driver Performance Benchmarks
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Benchmarks for driver layer performance (Phase 7C).
 * Run: npx tsx scripts/benchmarks/driver-perf.ts
 */

import { MemoryDriver } from '../../packages/drivers/memory/src';

type BenchmarkResult = {
  name: string;
  iterations: number;
  opsPerSec: number;
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
    opsPerSec: Math.round(1_000_000_000 / mean),
    p50: percentile(sorted, 0.5) / 1_000_000,
    p95: percentile(sorted, 0.95) / 1_000_000,
    p99: percentile(sorted, 0.99) / 1_000_000,
    mean: mean / 1_000_000,
  };
};

const run = async (name: string, iterations: number, fn: () => Promise<void>): Promise<BenchmarkResult> => {
  // Warmup
  const warmup = Math.min(iterations, 100);
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = nowNs();
    await fn();
    const end = nowNs();
    samples.push(end - start);
  }
  return summarize(name, samples, iterations);
};

const main = async () => {
  const results: BenchmarkResult[] = [];

  console.log('ObjectQL Driver Performance Benchmarks');
  console.log('======================================\n');

  // --- Benchmark 1: Memory Driver — Batch Inserts ---
  console.log('Running: Memory driver — batch inserts...');
  {
    const driver = new MemoryDriver({});

    let insertId = 0;
    results.push(
      await run('memory.insert.single', 5000, async () => {
        insertId++;
        await driver.create('bench_insert', { _id: String(insertId), name: `Record ${insertId}` }, {});
      })
    );
  }

  // --- Benchmark 2: Memory Driver — 10K Inserts (batch) ---
  console.log('Running: Memory driver — 10K inserts...');
  {
    const start = nowNs();
    const driver = new MemoryDriver({});

    for (let i = 0; i < 10_000; i++) {
      await driver.create('bench_10k', { _id: String(i), name: `Record ${i}`, status: i % 2 === 0 ? 'active' : 'inactive' }, {});
    }
    const end = nowNs();
    const totalMs = (end - start) / 1_000_000;
    results.push({
      name: 'memory.insert.10K_batch',
      iterations: 10_000,
      opsPerSec: Math.round(10_000 / (totalMs / 1000)),
      p50: totalMs / 10_000,
      p95: totalMs / 10_000,
      p99: totalMs / 10_000,
      mean: totalMs / 10_000,
    });
  }

  // --- Benchmark 3: Memory Driver — Find with Filter ---
  console.log('Running: Memory driver — find with filter...');
  {
    const initialData: Record<string, unknown>[] = Array.from({ length: 10_000 }).map((_, idx) => ({
      _id: String(idx),
      name: `Account ${idx}`,
      status: idx % 3 === 0 ? 'active' : idx % 3 === 1 ? 'inactive' : 'pending',
      score: idx,
    }));

    const driver = new MemoryDriver({
      initialData: { bench_find: initialData },
    });

    results.push(
      await run('memory.find.filter_10K', 2000, async () => {
        await driver.find('bench_find', {
          filters: [['status', '=', 'active']],
          top: 50,
        });
      })
    );
  }

  // --- Benchmark 4: Memory Driver — Find All (no filter, large result) ---
  console.log('Running: Memory driver — find all...');
  {
    const initialData: Record<string, unknown>[] = Array.from({ length: 5_000 }).map((_, idx) => ({
      _id: String(idx),
      name: `Record ${idx}`,
    }));

    const driver = new MemoryDriver({
      initialData: { bench_all: initialData },
    });

    results.push(
      await run('memory.find.all_5K', 1000, async () => {
        await driver.find('bench_all', {});
      })
    );
  }

  // --- Benchmark 5: Memory Driver — FindOne by ID ---
  console.log('Running: Memory driver — findOne by ID...');
  {
    const initialData: Record<string, unknown>[] = Array.from({ length: 10_000 }).map((_, idx) => ({
      _id: String(idx),
      name: `Record ${idx}`,
    }));

    const driver = new MemoryDriver({
      initialData: { bench_get: initialData },
    });

    results.push(
      await run('memory.findOne.byId_10K', 5000, async () => {
        await driver.findOne('bench_get', String(Math.floor(Math.random() * 10_000)));
      })
    );
  }

  // --- Benchmark 6: Memory Driver — Count ---
  console.log('Running: Memory driver — count...');
  {
    const initialData: Record<string, unknown>[] = Array.from({ length: 10_000 }).map((_, idx) => ({
      _id: String(idx),
      name: `Record ${idx}`,
      status: idx % 2 === 0 ? 'active' : 'inactive',
    }));

    const driver = new MemoryDriver({
      initialData: { bench_count: initialData },
    });

    results.push(
      await run('memory.count.filtered_10K', 2000, async () => {
        await driver.count('bench_count', { filters: [['status', '=', 'active']] }, {});
      })
    );
  }

  // --- Benchmark 7: Memory Driver — Update ---
  console.log('Running: Memory driver — update...');
  {
    const initialData: Record<string, unknown>[] = Array.from({ length: 1_000 }).map((_, idx) => ({
      _id: String(idx),
      name: `Record ${idx}`,
      counter: 0,
    }));

    const driver = new MemoryDriver({
      initialData: { bench_update: initialData },
    });

    let updateCounter = 0;
    results.push(
      await run('memory.update.single', 5000, async () => {
        updateCounter++;
        const id = String(updateCounter % 1_000);
        await driver.update('bench_update', id, { counter: updateCounter }, {});
      })
    );
  }

  // --- Benchmark 8: Memory Driver — Delete ---
  console.log('Running: Memory driver — delete + re-create...');
  {
    const driver = new MemoryDriver({});

    // Pre-create records
    for (let i = 0; i < 1_000; i++) {
      await driver.create('bench_delete', { _id: String(i), name: `Record ${i}` }, {});
    }

    let deleteIdx = 0;
    results.push(
      await run('memory.delete.single', 1000, async () => {
        const id = String(deleteIdx % 1_000);
        await driver.delete('bench_delete', id, {});
        // Re-create for next iteration
        await driver.create('bench_delete', { _id: id, name: `Record ${id}` }, {});
        deleteIdx++;
      })
    );
  }

  // --- Print Results ---
  console.log('\n\nDriver Performance Results (ms)');
  console.log('================================');
  console.table(results.map(r => ({
    benchmark: r.name,
    iterations: r.iterations,
    'ops/sec': r.opsPerSec.toLocaleString(),
    'p50 (ms)': r.p50.toFixed(3),
    'p95 (ms)': r.p95.toFixed(3),
    'p99 (ms)': r.p99.toFixed(3),
    'mean (ms)': r.mean.toFixed(3),
  })));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
