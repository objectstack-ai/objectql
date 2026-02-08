/**
 * ObjectQL Sync Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MutationLogger } from './mutation-logger.js';
import { LastWriteWinsResolver, CrdtResolver, ManualResolver, createResolver } from './conflict-resolver.js';
import { SyncEngine, type SyncTransport } from './sync-engine.js';
import { SyncPlugin } from './plugin.js';
import type { SyncConflict, SyncPushResponse } from '@objectql/types';

// ============================================================================
// MutationLogger Tests
// ============================================================================

describe('MutationLogger', () => {
  let logger: MutationLogger;

  beforeEach(() => {
    logger = new MutationLogger('client-1');
  });

  it('should initialize with zero pending mutations', () => {
    expect(logger.size).toBe(0);
    expect(logger.getPending()).toHaveLength(0);
  });

  it('should append mutations with incrementing sequence', () => {
    const m1 = logger.append({
      objectName: 'task',
      recordId: '1',
      operation: 'create',
      data: { title: 'Test' },
      baseVersion: null,
    });
    const m2 = logger.append({
      objectName: 'task',
      recordId: '2',
      operation: 'create',
      data: { title: 'Test 2' },
      baseVersion: null,
    });

    expect(m1.sequence).toBe(1);
    expect(m2.sequence).toBe(2);
    expect(m1.clientId).toBe('client-1');
    expect(logger.size).toBe(2);
  });

  it('should generate unique IDs', () => {
    const m1 = logger.append({ objectName: 'task', recordId: '1', operation: 'create', baseVersion: null });
    const m2 = logger.append({ objectName: 'task', recordId: '2', operation: 'create', baseVersion: null });
    expect(m1.id).not.toBe(m2.id);
  });

  it('should filter pending by object name', () => {
    logger.append({ objectName: 'task', recordId: '1', operation: 'create', baseVersion: null });
    logger.append({ objectName: 'project', recordId: '1', operation: 'create', baseVersion: null });
    logger.append({ objectName: 'task', recordId: '2', operation: 'update', data: { title: 'Updated' }, baseVersion: 1 });

    expect(logger.getPendingForObject('task')).toHaveLength(2);
    expect(logger.getPendingForObject('project')).toHaveLength(1);
  });

  it('should acknowledge synced mutations', () => {
    const m1 = logger.append({ objectName: 'task', recordId: '1', operation: 'create', baseVersion: null });
    const m2 = logger.append({ objectName: 'task', recordId: '2', operation: 'create', baseVersion: null });
    logger.append({ objectName: 'task', recordId: '3', operation: 'create', baseVersion: null });

    logger.acknowledge([m1.id, m2.id]);
    expect(logger.size).toBe(1);
    expect(logger.getPending()[0].recordId).toBe('3');
  });

  it('should clear all mutations', () => {
    logger.append({ objectName: 'task', recordId: '1', operation: 'create', baseVersion: null });
    logger.append({ objectName: 'task', recordId: '2', operation: 'create', baseVersion: null });
    logger.clear();
    expect(logger.size).toBe(0);
  });

  it('should return correct clientId', () => {
    expect(logger.getClientId()).toBe('client-1');
  });

  it('should record timestamps', () => {
    const before = new Date().toISOString();
    const m = logger.append({ objectName: 'task', recordId: '1', operation: 'create', baseVersion: null });
    const after = new Date().toISOString();
    expect(m.timestamp >= before).toBe(true);
    expect(m.timestamp <= after).toBe(true);
  });
});

// ============================================================================
// Conflict Resolver Tests
// ============================================================================

describe('LastWriteWinsResolver', () => {
  const resolver = new LastWriteWinsResolver();

  it('should have correct strategy name', () => {
    expect(resolver.strategy).toBe('last-write-wins');
  });

  it('should apply client mutation when client timestamp is newer', () => {
    const conflict: SyncConflict = {
      objectName: 'task',
      recordId: '1',
      clientMutation: {
        id: 'mut-1',
        objectName: 'task',
        recordId: '1',
        operation: 'update',
        data: { title: 'Client' },
        timestamp: '2026-01-02T00:00:00.000Z',
        clientId: 'c1',
        sequence: 1,
        baseVersion: 1,
      },
      serverRecord: { title: 'Server', updated_at: '2026-01-01T00:00:00.000Z' },
      conflictingFields: ['title'],
    };

    const result = resolver.resolve(conflict);
    expect(result.status).toBe('applied');
  });

  it('should flag conflict when server timestamp is newer', () => {
    const conflict: SyncConflict = {
      objectName: 'task',
      recordId: '1',
      clientMutation: {
        id: 'mut-1',
        objectName: 'task',
        recordId: '1',
        operation: 'update',
        data: { title: 'Client' },
        timestamp: '2026-01-01T00:00:00.000Z',
        clientId: 'c1',
        sequence: 1,
        baseVersion: 1,
      },
      serverRecord: { title: 'Server', updated_at: '2026-01-02T00:00:00.000Z' },
      conflictingFields: ['title'],
    };

    const result = resolver.resolve(conflict);
    expect(result.status).toBe('conflict');
  });
});

describe('CrdtResolver', () => {
  const resolver = new CrdtResolver();

  it('should have correct strategy name', () => {
    expect(resolver.strategy).toBe('crdt');
  });

  it('should apply non-conflicting field changes', () => {
    const conflict: SyncConflict = {
      objectName: 'task',
      recordId: '1',
      clientMutation: {
        id: 'mut-1',
        objectName: 'task',
        recordId: '1',
        operation: 'update',
        data: { description: 'Updated desc' },
        timestamp: '2026-01-01T00:00:00.000Z',
        clientId: 'c1',
        sequence: 1,
        baseVersion: 1,
      },
      serverRecord: { title: 'Server Title', description: 'Old desc' },
      conflictingFields: ['title'], // Only title is conflicting
    };

    const result = resolver.resolve(conflict);
    expect(result.status).toBe('applied');
  });
});

describe('ManualResolver', () => {
  it('should have correct strategy name', () => {
    const resolver = new ManualResolver();
    expect(resolver.strategy).toBe('manual');
  });

  it('should flag conflict when no callback is provided', () => {
    const resolver = new ManualResolver();
    const conflict: SyncConflict = {
      objectName: 'task',
      recordId: '1',
      clientMutation: {
        id: 'mut-1',
        objectName: 'task',
        recordId: '1',
        operation: 'update',
        data: { title: 'Client' },
        timestamp: '2026-01-01T00:00:00.000Z',
        clientId: 'c1',
        sequence: 1,
        baseVersion: 1,
      },
      serverRecord: { title: 'Server' },
      conflictingFields: ['title'],
    };

    const result = resolver.resolve(conflict);
    expect(result.status).toBe('conflict');
  });

  it('should apply resolution when callback returns data', () => {
    const resolver = new ManualResolver(() => ({ title: 'Merged' }));
    const conflict: SyncConflict = {
      objectName: 'task',
      recordId: '1',
      clientMutation: {
        id: 'mut-1',
        objectName: 'task',
        recordId: '1',
        operation: 'update',
        data: { title: 'Client' },
        timestamp: '2026-01-01T00:00:00.000Z',
        clientId: 'c1',
        sequence: 1,
        baseVersion: 1,
      },
      serverRecord: { title: 'Server' },
      conflictingFields: ['title'],
    };

    const result = resolver.resolve(conflict);
    expect(result.status).toBe('applied');
  });

  it('should flag conflict when callback returns undefined', () => {
    const resolver = new ManualResolver(() => undefined);
    const conflict: SyncConflict = {
      objectName: 'task',
      recordId: '1',
      clientMutation: {
        id: 'mut-1',
        objectName: 'task',
        recordId: '1',
        operation: 'update',
        data: {},
        timestamp: '2026-01-01T00:00:00.000Z',
        clientId: 'c1',
        sequence: 1,
        baseVersion: 1,
      },
      serverRecord: {},
      conflictingFields: ['title'],
    };

    const result = resolver.resolve(conflict);
    expect(result.status).toBe('conflict');
  });
});

describe('createResolver', () => {
  it('should create last-write-wins resolver', () => {
    const resolver = createResolver('last-write-wins');
    expect(resolver.strategy).toBe('last-write-wins');
  });

  it('should create crdt resolver', () => {
    const resolver = createResolver('crdt');
    expect(resolver.strategy).toBe('crdt');
  });

  it('should create manual resolver', () => {
    const resolver = createResolver('manual');
    expect(resolver.strategy).toBe('manual');
  });

  it('should default to last-write-wins for unknown strategy', () => {
    const resolver = createResolver('unknown');
    expect(resolver.strategy).toBe('last-write-wins');
  });
});

// ============================================================================
// SyncEngine Tests
// ============================================================================

describe('SyncEngine', () => {
  let transport: SyncTransport;
  let engine: SyncEngine;

  beforeEach(() => {
    transport = {
      push: vi.fn().mockResolvedValue({
        results: [{ status: 'applied', serverVersion: 1 }],
        serverChanges: [],
        checkpoint: 'cp-1',
      } satisfies SyncPushResponse),
    };

    engine = new SyncEngine({
      clientId: 'client-1',
      transport,
      config: {
        enabled: true,
        strategy: 'last-write-wins',
        debounce_ms: 100,
        batch_size: 10,
      },
    });
  });

  it('should record mutations', () => {
    engine.recordMutation({
      objectName: 'task',
      recordId: '1',
      operation: 'create',
      data: { title: 'Test' },
      baseVersion: null,
    });
    expect(engine.getMutationLogger().size).toBe(1);
  });

  it('should sync pending mutations', async () => {
    engine.recordMutation({
      objectName: 'task',
      recordId: '1',
      operation: 'create',
      data: { title: 'Test' },
      baseVersion: null,
    });

    engine.cancelScheduledSync();
    const response = await engine.sync();

    expect(response).not.toBeNull();
    expect(transport.push).toHaveBeenCalledTimes(1);
    expect(engine.getMutationLogger().size).toBe(0); // acknowledged
    expect(engine.getCheckpoint()).toBe('cp-1');
  });

  it('should return null when already syncing', async () => {
    // Slow transport
    (transport.push as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        results: [],
        serverChanges: [],
        checkpoint: 'cp-1',
      }), 100))
    );

    engine.recordMutation({ objectName: 'task', recordId: '1', operation: 'create', baseVersion: null });
    engine.cancelScheduledSync();

    const promise1 = engine.sync();
    const promise2 = engine.sync(); // Should return null

    expect(await promise2).toBeNull();
    await promise1;
  });

  it('should not sync when direction is pull-only', async () => {
    const pullEngine = new SyncEngine({
      clientId: 'client-1',
      transport,
      config: { enabled: true, direction: 'pull-only' },
    });

    pullEngine.recordMutation({ objectName: 'task', recordId: '1', operation: 'create', baseVersion: null });
    const response = await pullEngine.sync();
    expect(response).toBeNull();
    expect(transport.push).not.toHaveBeenCalled();
  });

  it('should handle sync errors gracefully', async () => {
    (transport.push as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    engine.recordMutation({ objectName: 'task', recordId: '1', operation: 'create', baseVersion: null });
    engine.cancelScheduledSync();

    const errorListener = vi.fn();
    engine.addListener({ onSyncError: errorListener });

    const response = await engine.sync();
    expect(response).toBeNull();
    expect(errorListener).toHaveBeenCalled();
    expect(engine.getMutationLogger().size).toBe(1); // Not acknowledged
  });

  it('should notify listeners on sync events', async () => {
    const listener = {
      onSyncStart: vi.fn(),
      onSyncComplete: vi.fn(),
      onServerChanges: vi.fn(),
    };
    engine.addListener(listener);

    (transport.push as ReturnType<typeof vi.fn>).mockResolvedValue({
      results: [{ status: 'applied', serverVersion: 1 }],
      serverChanges: [{ objectName: 'task', recordId: '2', operation: 'create', data: { title: 'Server' }, serverVersion: 1, timestamp: new Date().toISOString() }],
      checkpoint: 'cp-2',
    } satisfies SyncPushResponse);

    engine.recordMutation({ objectName: 'task', recordId: '1', operation: 'create', baseVersion: null });
    engine.cancelScheduledSync();
    await engine.sync();

    expect(listener.onSyncStart).toHaveBeenCalled();
    expect(listener.onSyncComplete).toHaveBeenCalled();
    expect(listener.onServerChanges).toHaveBeenCalled();
  });

  it('should remove listeners', () => {
    const listener = { onSyncStart: vi.fn() };
    engine.addListener(listener);
    engine.removeListener(listener);
    // No way to assert directly, but it should not throw
  });

  it('should set and get checkpoint', () => {
    engine.setCheckpoint('cp-100');
    expect(engine.getCheckpoint()).toBe('cp-100');
  });

  it('should report syncing state', () => {
    expect(engine.isSyncing()).toBe(false);
  });

  it('should batch mutations according to batch_size', async () => {
    for (let i = 0; i < 15; i++) {
      engine.recordMutation({
        objectName: 'task',
        recordId: String(i),
        operation: 'create',
        baseVersion: null,
      });
    }

    (transport.push as ReturnType<typeof vi.fn>).mockResolvedValue({
      results: Array(10).fill({ status: 'applied', serverVersion: 1 }),
      serverChanges: [],
      checkpoint: 'cp-batch',
    });

    engine.cancelScheduledSync();
    await engine.sync();

    const call = (transport.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.mutations).toHaveLength(10); // batch_size is 10
    expect(engine.getMutationLogger().size).toBe(5); // 15 - 10 = 5 remaining
  });
});

// ============================================================================
// SyncPlugin Tests
// ============================================================================

describe('SyncPlugin', () => {
  it('should have correct name and version', () => {
    const plugin = new SyncPlugin({
      clientId: 'test',
      transport: { push: vi.fn() },
    });
    expect(plugin.name).toBe('@objectql/plugin-sync');
    expect(plugin.version).toBe('4.2.0');
  });

  it('should install sync capabilities on kernel', async () => {
    const plugin = new SyncPlugin({
      clientId: 'test',
      transport: { push: vi.fn() },
    });
    const kernel: Record<string, unknown> = {};
    await plugin.install({ engine: kernel });

    expect(kernel['sync']).toBeDefined();
    expect((kernel['sync'] as Record<string, unknown>).getEngine).toBeDefined();
    expect((kernel['sync'] as Record<string, unknown>).getAllEngines).toBeDefined();
    expect((kernel['sync'] as Record<string, unknown>).syncAll).toBeDefined();
  });

  it('should create engines lazily', async () => {
    const plugin = new SyncPlugin({
      clientId: 'test',
      transport: { push: vi.fn() },
    });
    const kernel: Record<string, unknown> = {};
    await plugin.install({ engine: kernel });

    expect(plugin.getAllEngines().size).toBe(0);

    const engine = plugin.getEngine('task');
    expect(engine).toBeDefined();
    expect(plugin.getAllEngines().size).toBe(1);
  });

  it('should reuse engines for the same object', () => {
    const plugin = new SyncPlugin({
      clientId: 'test',
      transport: { push: vi.fn() },
    });

    const engine1 = plugin.getEngine('task');
    const engine2 = plugin.getEngine('task');
    expect(engine1).toBe(engine2);
  });

  it('should cleanup on stop', async () => {
    const plugin = new SyncPlugin({
      clientId: 'test',
      transport: { push: vi.fn() },
    });
    const ctx = { engine: {} };
    await plugin.install(ctx);

    plugin.getEngine('task');
    plugin.getEngine('project');
    expect(plugin.getAllEngines().size).toBe(2);

    await plugin.onStop!(ctx);
    expect(plugin.getAllEngines().size).toBe(0);
  });

  it('should sync all engines', async () => {
    const transport = {
      push: vi.fn().mockResolvedValue({
        results: [],
        serverChanges: [],
        checkpoint: 'cp-1',
      }),
    };

    const plugin = new SyncPlugin({
      clientId: 'test',
      transport,
    });

    const engine1 = plugin.getEngine('task');
    const engine2 = plugin.getEngine('project');

    // Add mutations to both engines
    engine1.recordMutation({ objectName: 'task', recordId: '1', operation: 'create', baseVersion: null });
    engine2.recordMutation({ objectName: 'project', recordId: '1', operation: 'create', baseVersion: null });

    engine1.cancelScheduledSync();
    engine2.cancelScheduledSync();

    await plugin.syncAll();
    expect(transport.push).toHaveBeenCalledTimes(2);
  });
});
