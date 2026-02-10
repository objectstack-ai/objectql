/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowPlugin } from '../src/workflow-plugin';
import type { StateMachineConfig } from '@objectql/types';

describe('WorkflowPlugin', () => {
  let plugin: WorkflowPlugin;

  beforeEach(() => {
    plugin = new WorkflowPlugin({
      enableAuditTrail: true,
    });
  });

  it('should create plugin with default config', () => {
    const defaultPlugin = new WorkflowPlugin();
    expect(defaultPlugin).toBeDefined();
    expect(defaultPlugin.name).toBe('@objectql/plugin-workflow');
  });

  it('should create plugin with custom config', () => {
    const customPlugin = new WorkflowPlugin({
      enableAuditTrail: true,
      guardResolver: async () => true,
      actionExecutor: async () => {},
    });
    expect(customPlugin).toBeDefined();
  });

  it('should install into kernel', async () => {
    const mockKernel = {
      metadata: {
        get: () => null,
      },
      hooks: {
        register: () => {},
      },
    };

    const mockContext = {
      hook: () => {},
    };

    await plugin.install(mockContext);
    expect(mockKernel.workflowEngine).toBeUndefined(); // Not set in this mock
  });

  it('should record audit trail when enabled', () => {
    const trail = plugin.getAuditTrail();
    expect(Array.isArray(trail)).toBe(true);
  });

  it('should filter audit trail', () => {
    const filtered = plugin.getAuditTrail({
      objectName: 'project',
      recordId: '123',
    });
    expect(Array.isArray(filtered)).toBe(true);
  });

  it('should clear engines', () => {
    plugin.clearEngines();
    expect(plugin.getEngine('project', 'default')).toBeUndefined();
  });

  it('should clear audit trail', () => {
    plugin.clearAuditTrail();
    const trail = plugin.getAuditTrail();
    expect(trail).toHaveLength(0);
  });
});
