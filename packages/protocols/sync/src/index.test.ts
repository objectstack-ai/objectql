/**
 * ObjectQL Sync Protocol — Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeLog } from './change-log.js';
import { VersionStore } from './version-store.js';
import { SyncHandler, type RecordResolver } from './sync-handler.js';
import { SyncProtocolPlugin } from './plugin.js';
import type { SyncPushRequest, MutationLogEntry } from '@objectql/types';

// ============================================================================
// ChangeLog Tests
// ============================================================================

describe('ChangeLog', () => {
  let log: ChangeLog;

  beforeEach(() => {
    log = new ChangeLog(30);
  });

  it('should start empty', () => {
    expect(log.size).toBe(0);
    expect(log.getCurrentCheckpoint()).toBe('0');
  });

  it('should record changes with incrementing checkpoints', () => {
    const e1 = log.record({ objectName: 'task', recordId: '1', operation: 'create', data: { title: 'A' }, serverVersion: 1 });
    const e2 = log.record({ objectName: 'task', recordId: '2', operation: 'create', data: { title: 'B' }, serverVersion: 1 });

    expect(e1.checkpointSeq).toBe(1);
    expect(e2.checkpointSeq).toBe(2);
    expect(log.size).toBe(2);
    expect(log.getCurrentCheckpoint()).toBe('2');
  });

  it('should return all changes when checkpoint is null', () => {
    log.record({ objectName: 'task', recordId: '1', operation: 'create', serverVersion: 1 });
    log.record({ objectName: 'task', recordId: '2', operation: 'create', serverVersion: 1 });

    const changes = log.getChangesSince(null);
    expect(changes).toHaveLength(2);
  });

  it('should return changes since a specific checkpoint', () => {
    log.record({ objectName: 'task', recordId: '1', operation: 'create', serverVersion: 1 });
    log.record({ objectName: 'task', recordId: '2', operation: 'create', serverVersion: 1 });
    log.record({ objectName: 'task', recordId: '3', operation: 'create', serverVersion: 1 });

    const changes = log.getChangesSince('1');
    expect(changes).toHaveLength(2);
    expect(changes[0].recordId).toBe('2');
    expect(changes[1].recordId).toBe('3');
  });

  it('should return all changes for invalid checkpoint', () => {
    log.record({ objectName: 'task', recordId: '1', operation: 'create', serverVersion: 1 });
    const changes = log.getChangesSince('invalid');
    expect(changes).toHaveLength(1);
  });

  it('should record timestamps', () => {
    const entry = log.record({ objectName: 'task', recordId: '1', operation: 'create', serverVersion: 1 });
    expect(entry.timestamp).toBeDefined();
    expect(new Date(entry.timestamp).getTime()).not.toBeNaN();
  });
});

// ============================================================================
// VersionStore Tests
// ============================================================================

describe('VersionStore', () => {
  let store: VersionStore;

  beforeEach(() => {
    store = new VersionStore();
  });

  it('should return 0 for unknown records', () => {
    expect(store.getVersion('task', '1')).toBe(0);
  });

  it('should increment versions', () => {
    expect(store.increment('task', '1')).toBe(1);
    expect(store.increment('task', '1')).toBe(2);
    expect(store.increment('task', '1')).toBe(3);
  });

  it('should track versions per record', () => {
    store.increment('task', '1');
    store.increment('task', '1');
    store.increment('task', '2');

    expect(store.getVersion('task', '1')).toBe(2);
    expect(store.getVersion('task', '2')).toBe(1);
  });

  it('should track versions across objects', () => {
    store.increment('task', '1');
    store.increment('project', '1');

    expect(store.getVersion('task', '1')).toBe(1);
    expect(store.getVersion('project', '1')).toBe(1);
  });

  it('should remove version tracking', () => {
    store.increment('task', '1');
    store.increment('task', '1');
    store.remove('task', '1');

    expect(store.getVersion('task', '1')).toBe(0);
    expect(store.size).toBe(0);
  });

  it('should report correct size', () => {
    store.increment('task', '1');
    store.increment('task', '2');
    store.increment('project', '1');

    expect(store.size).toBe(3);
  });
});

// ============================================================================
// SyncHandler Tests
// ============================================================================

describe('SyncHandler', () => {
  let handler: SyncHandler;
  let resolver: RecordResolver;
  let records: Map<string, Record<string, unknown>>;

  beforeEach(() => {
    records = new Map();
    resolver = {
      getRecord: vi.fn(async (objectName: string, recordId: string | number) => {
        return records.get(`${objectName}:${recordId}`) ?? null;
      }),
      applyMutation: vi.fn(async (mutation: MutationLogEntry, _serverVersion: number) => {
        const key = `${mutation.objectName}:${mutation.recordId}`;
        if (mutation.operation === 'delete') {
          records.delete(key);
        } else if (mutation.operation === 'create') {
          records.set(key, { ...mutation.data });
        } else {
          const existing = records.get(key) ?? {};
          records.set(key, { ...existing, ...mutation.data });
        }
      }),
    };
    handler = new SyncHandler({
      config: { enabled: true, maxMutationsPerRequest: 100 },
    });
  });

  it('should apply create mutations', async () => {
    const request: SyncPushRequest = {
      clientId: 'c1',
      mutations: [{
        id: 'm1',
        objectName: 'task',
        recordId: '1',
        operation: 'create',
        data: { title: 'New Task' },
        timestamp: new Date().toISOString(),
        clientId: 'c1',
        sequence: 1,
        baseVersion: null,
      }],
      lastCheckpoint: null,
    };

    const response = await handler.handlePush(request, resolver);
    expect(response.results).toHaveLength(1);
    expect(response.results[0].status).toBe('applied');
    expect(response.checkpoint).toBeTruthy();
  });

  it('should apply update mutations without conflict', async () => {
    // First create
    records.set('task:1', { title: 'Original' });
    handler.getVersionStore().increment('task', '1'); // version 1

    const request: SyncPushRequest = {
      clientId: 'c1',
      mutations: [{
        id: 'm1',
        objectName: 'task',
        recordId: '1',
        operation: 'update',
        data: { title: 'Updated' },
        timestamp: new Date().toISOString(),
        clientId: 'c1',
        sequence: 1,
        baseVersion: 1, // matches server version
      }],
      lastCheckpoint: null,
    };

    const response = await handler.handlePush(request, resolver);
    expect(response.results[0].status).toBe('applied');
  });

  it('should detect conflicts on version mismatch with conflict fields', async () => {
    records.set('task:1', { title: 'Server Title', status: 'active' });

    const conflictHandler = new SyncHandler({
      config: { enabled: true },
      conflictFields: new Map([['task', ['title', 'status']]]),
    });
    // Set versions to match — version 2 on server
    conflictHandler.getVersionStore().increment('task', '1');
    conflictHandler.getVersionStore().increment('task', '1');

    const request: SyncPushRequest = {
      clientId: 'c1',
      mutations: [{
        id: 'm1',
        objectName: 'task',
        recordId: '1',
        operation: 'update',
        data: { title: 'Client Title' },
        timestamp: new Date().toISOString(),
        clientId: 'c1',
        sequence: 1,
        baseVersion: 1, // behind server version 2
      }],
      lastCheckpoint: null,
    };

    const response = await conflictHandler.handlePush(request, resolver);
    expect(response.results[0].status).toBe('conflict');
  });

  it('should apply delete mutations', async () => {
    records.set('task:1', { title: 'To Delete' });
    handler.getVersionStore().increment('task', '1');

    const request: SyncPushRequest = {
      clientId: 'c1',
      mutations: [{
        id: 'm1',
        objectName: 'task',
        recordId: '1',
        operation: 'delete',
        timestamp: new Date().toISOString(),
        clientId: 'c1',
        sequence: 1,
        baseVersion: 1,
      }],
      lastCheckpoint: null,
    };

    const response = await handler.handlePush(request, resolver);
    expect(response.results[0].status).toBe('applied');
  });

  it('should reject delete of non-existent records', async () => {
    const request: SyncPushRequest = {
      clientId: 'c1',
      mutations: [{
        id: 'm1',
        objectName: 'task',
        recordId: '999',
        operation: 'delete',
        timestamp: new Date().toISOString(),
        clientId: 'c1',
        sequence: 1,
        baseVersion: null,
      }],
      lastCheckpoint: null,
    };

    const response = await handler.handlePush(request, resolver);
    expect(response.results[0].status).toBe('rejected');
  });

  it('should reject when mutations exceed limit', async () => {
    const limitHandler = new SyncHandler({
      config: { enabled: true, maxMutationsPerRequest: 2 },
    });

    const mutations: MutationLogEntry[] = Array.from({ length: 3 }, (_, i) => ({
      id: `m${i}`,
      objectName: 'task',
      recordId: String(i),
      operation: 'create' as const,
      data: { title: `Task ${i}` },
      timestamp: new Date().toISOString(),
      clientId: 'c1',
      sequence: i + 1,
      baseVersion: null,
    }));

    const response = await limitHandler.handlePush(
      { clientId: 'c1', mutations, lastCheckpoint: null },
      resolver
    );

    expect(response.results).toHaveLength(3);
    for (const result of response.results) {
      expect(result.status).toBe('rejected');
    }
  });

  it('should return server changes since checkpoint', async () => {
    // Record some changes on the server
    handler.getChangeLog().record({ objectName: 'task', recordId: '10', operation: 'create', data: { title: 'Server' }, serverVersion: 1 });
    handler.getChangeLog().record({ objectName: 'task', recordId: '11', operation: 'create', data: { title: 'Server 2' }, serverVersion: 1 });

    const request: SyncPushRequest = {
      clientId: 'c1',
      mutations: [],
      lastCheckpoint: '1', // Only want changes after checkpoint 1
    };

    const response = await handler.handlePush(request, resolver);
    expect(response.serverChanges).toHaveLength(1);
    expect(response.serverChanges[0].recordId).toBe('11');
  });

  it('should process multiple mutations in order', async () => {
    const request: SyncPushRequest = {
      clientId: 'c1',
      mutations: [
        {
          id: 'm1', objectName: 'task', recordId: '1', operation: 'create',
          data: { title: 'Task 1' }, timestamp: new Date().toISOString(),
          clientId: 'c1', sequence: 1, baseVersion: null,
        },
        {
          id: 'm2', objectName: 'task', recordId: '2', operation: 'create',
          data: { title: 'Task 2' }, timestamp: new Date().toISOString(),
          clientId: 'c1', sequence: 2, baseVersion: null,
        },
      ],
      lastCheckpoint: null,
    };

    const response = await handler.handlePush(request, resolver);
    expect(response.results).toHaveLength(2);
    expect(response.results[0].status).toBe('applied');
    expect(response.results[1].status).toBe('applied');
  });
});

// ============================================================================
// SyncProtocolPlugin Tests
// ============================================================================

describe('SyncProtocolPlugin', () => {
  it('should have correct name and version', () => {
    const plugin = new SyncProtocolPlugin({
      endpoint: { enabled: true },
    });
    expect(plugin.name).toBe('@objectql/protocol-sync');
    expect(plugin.version).toBe('4.2.0');
  });

  it('should install handler on kernel when enabled', async () => {
    const plugin = new SyncProtocolPlugin({
      endpoint: { enabled: true },
    });
    const kernel: Record<string, unknown> = {};
    await plugin.install({ engine: kernel });

    expect(kernel['syncProtocol']).toBeDefined();
    expect((kernel['syncProtocol'] as Record<string, unknown>)['handler']).toBeDefined();
    expect((kernel['syncProtocol'] as Record<string, unknown>)['handlePush']).toBeDefined();
  });

  it('should not install when disabled', async () => {
    const plugin = new SyncProtocolPlugin({
      endpoint: { enabled: false },
    });
    const kernel: Record<string, unknown> = {};
    await plugin.install({ engine: kernel });

    expect(kernel['syncProtocol']).toBeUndefined();
  });

  it('should return handler after install', async () => {
    const plugin = new SyncProtocolPlugin({
      endpoint: { enabled: true },
    });
    await plugin.install({ engine: {} });
    expect(plugin.getHandler()).not.toBeNull();
  });

  it('should clear handler on stop', async () => {
    const plugin = new SyncProtocolPlugin({
      endpoint: { enabled: true },
    });
    const ctx = { engine: {} };
    await plugin.install(ctx);
    await plugin.onStop(ctx);
    expect(plugin.getHandler()).toBeNull();
  });

  it('should support onStart lifecycle', async () => {
    const plugin = new SyncProtocolPlugin({
      endpoint: { enabled: true },
    });
    const ctx = { engine: {} };
    await plugin.install(ctx);
    await plugin.onStart(ctx);
    // Should not throw
  });
});
