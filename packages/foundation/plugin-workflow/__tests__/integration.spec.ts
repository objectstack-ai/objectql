/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowPlugin } from '../src/workflow-plugin';
import { ObjectQLError } from '@objectql/types';
import type { StateMachineConfig } from '@objectql/types';

/**
 * Integration tests for the workflow plugin
 * These test the end-to-end workflow from hook registration to state transition
 */
describe('Integration Tests', () => {
  describe('End-to-End State Machine', () => {
    it('should allow valid state transitions', async () => {
      const plugin = new WorkflowPlugin({ enableAuditTrail: true });

      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {
            on: {
              submit: { target: 'active' },
            },
          },
          active: {
            on: {
              complete: { target: 'done' },
            },
          },
          done: {
            type: 'final',
          },
        },
      };

      // Simulate kernel metadata
      const mockKernel = {
        metadata: {
          get: (type: string, name: string) => {
            if (type === 'object' && name === 'project') {
              return {
                name: 'project',
                stateMachine: config,
              };
            }
            return null;
          },
        },
        hooks: {
          register: (hookName: string, objectName: string, handler: any) => {
            // Store the handler for testing
            mockKernel._handlers = mockKernel._handlers || {};
            mockKernel._handlers[hookName] = handler;
          },
        },
        _handlers: {} as any,
      };

      const mockContext = {
        hook: (hookName: string, handler: any) => {
          mockContext._handlers = mockContext._handlers || {};
          (mockContext._handlers as any)[hookName] = handler;
        },
        _handlers: {} as any,
      };

      await plugin.install(mockContext);

      // Get the beforeUpdate handler
      const handler = (mockContext._handlers as any).beforeUpdate;
      expect(handler).toBeDefined();

      // Test valid transition
      const updateContext = {
        objectName: 'project',
        data: { status: 'active', id: '1' },
        previousData: { status: 'draft', id: '1' },
        operation: 'update',
        user: { id: 'user1' },
      };

      // Inject the kernel into plugin for testing
      (plugin as any).kernel = mockKernel;

      await handler(updateContext);

      // Should not throw, transition should be allowed
      expect(updateContext.data.status).toBe('active');

      // Check audit trail
      const trail = plugin.getAuditTrail({ objectName: 'project' });
      expect(trail.length).toBeGreaterThan(0);
      expect(trail[0].currentState).toBe('active');
      expect(trail[0].previousState).toBe('draft');
    });

    it('should block invalid state transitions', async () => {
      const plugin = new WorkflowPlugin();

      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {
            on: {
              submit: { target: 'active' },
            },
          },
          active: {},
          done: {
            type: 'final',
          },
        },
      };

      const mockKernel = {
        metadata: {
          get: (type: string, name: string) => {
            if (type === 'object' && name === 'project') {
              return {
                name: 'project',
                stateMachine: config,
              };
            }
            return null;
          },
        },
        hooks: {
          register: (hookName: string, objectName: string, handler: any) => {
            mockKernel._handlers = mockKernel._handlers || {};
            mockKernel._handlers[hookName] = handler;
          },
        },
        _handlers: {} as any,
      };

      const mockContext = {
        hook: (hookName: string, handler: any) => {
          mockContext._handlers = mockContext._handlers || {};
          (mockContext._handlers as any)[hookName] = handler;
        },
        _handlers: {} as any,
      };

      await plugin.install(mockContext);

      const handler = (mockContext._handlers as any).beforeUpdate;
      (plugin as any).kernel = mockKernel;

      // Test invalid transition (draft -> done, skipping active)
      const updateContext = {
        objectName: 'project',
        data: { status: 'done', id: '1' },
        previousData: { status: 'draft', id: '1' },
        operation: 'update',
        user: { id: 'user1' },
      };

      await expect(handler(updateContext)).rejects.toThrow(ObjectQLError);
    });

    it('should enforce guard conditions', async () => {
      const plugin = new WorkflowPlugin();

      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {
            on: {
              submit: {
                target: 'active',
                cond: {
                  field: 'approved',
                  operator: 'equals',
                  value: true,
                },
              },
            },
          },
          active: {},
        },
      };

      const mockKernel = {
        metadata: {
          get: (type: string, name: string) => {
            if (type === 'object' && name === 'project') {
              return { name: 'project', stateMachine: config };
            }
            return null;
          },
        },
        hooks: {
          register: (hookName: string, objectName: string, handler: any) => {
            mockKernel._handlers = mockKernel._handlers || {};
            mockKernel._handlers[hookName] = handler;
          },
        },
        _handlers: {} as any,
      };

      const mockContext = {
        hook: (hookName: string, handler: any) => {
          mockContext._handlers = mockContext._handlers || {};
          (mockContext._handlers as any)[hookName] = handler;
        },
        _handlers: {} as any,
      };

      await plugin.install(mockContext);

      const handler = (mockContext._handlers as any).beforeUpdate;
      (plugin as any).kernel = mockKernel;

      // Test with guard failing
      const updateContext1 = {
        objectName: 'project',
        data: { status: 'active', approved: false, id: '1' },
        previousData: { status: 'draft', id: '1' },
        operation: 'update',
        user: { id: 'user1' },
      };

      await expect(handler(updateContext1)).rejects.toThrow(ObjectQLError);

      // Test with guard passing
      const updateContext2 = {
        objectName: 'project',
        data: { status: 'active', approved: true, id: '1' },
        previousData: { status: 'draft', id: '1' },
        operation: 'update',
        user: { id: 'user1' },
      };

      await handler(updateContext2);
      expect(updateContext2.data.status).toBe('active');
    });

    it('should execute actions on transition', async () => {
      const executedActions: string[] = [];

      const plugin = new WorkflowPlugin({
        actionExecutor: async (action: string) => {
          executedActions.push(action);
        },
      });

      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {
            exit: ['onExitDraft'],
            on: {
              submit: {
                target: 'active',
                actions: ['notifyApprover'],
              },
            },
          },
          active: {
            entry: ['onEnterActive'],
          },
        },
      };

      const mockKernel = {
        metadata: {
          get: (type: string, name: string) => {
            if (type === 'object' && name === 'project') {
              return { name: 'project', stateMachine: config };
            }
            return null;
          },
        },
        hooks: {
          register: (hookName: string, objectName: string, handler: any) => {
            mockKernel._handlers = mockKernel._handlers || {};
            mockKernel._handlers[hookName] = handler;
          },
        },
        _handlers: {} as any,
      };

      const mockContext = {
        hook: (hookName: string, handler: any) => {
          mockContext._handlers = mockContext._handlers || {};
          (mockContext._handlers as any)[hookName] = handler;
        },
        _handlers: {} as any,
      };

      await plugin.install(mockContext);

      const handler = (mockContext._handlers as any).beforeUpdate;
      (plugin as any).kernel = mockKernel;

      const updateContext = {
        objectName: 'project',
        data: { status: 'active', id: '1' },
        previousData: { status: 'draft', id: '1' },
        operation: 'update',
        user: { id: 'user1' },
      };

      await handler(updateContext);

      expect(executedActions).toEqual(['onExitDraft', 'notifyApprover', 'onEnterActive']);
    });
  });

  describe('TCK Test Case', () => {
    it('should pass Technology Compatibility Kit test', async () => {
      const plugin = new WorkflowPlugin({ enableAuditTrail: true });

      // TCK Test Case: Project Approval Workflow
      const config: StateMachineConfig = {
        initial: 'draft',
        states: {
          draft: {
            on: {
              submit: {
                target: 'pending_approval',
                cond: {
                  field: 'complete',
                  operator: 'equals',
                  value: true,
                },
              },
            },
          },
          pending_approval: {
            on: {
              approve: {
                target: 'approved',
                cond: 'hasRole:approver',
              },
              reject: { target: 'rejected' },
            },
          },
          approved: {
            on: {
              activate: { target: 'active' },
            },
          },
          rejected: {
            on: {
              resubmit: { target: 'draft' },
            },
          },
          active: {
            type: 'final',
          },
        },
      };

      const mockKernel = {
        metadata: {
          get: (type: string, name: string) => {
            if (type === 'object' && name === 'project') {
              return { name: 'project', stateMachine: config };
            }
            return null;
          },
        },
        hooks: {
          register: (hookName: string, objectName: string, handler: any) => {
            mockKernel._handlers = mockKernel._handlers || {};
            mockKernel._handlers[hookName] = handler;
          },
        },
        _handlers: {} as any,
      };

      const mockContext = {
        hook: (hookName: string, handler: any) => {
          mockContext._handlers = mockContext._handlers || {};
          (mockContext._handlers as any)[hookName] = handler;
        },
        _handlers: {} as any,
      };

      await plugin.install(mockContext);

      const handler = (mockContext._handlers as any).beforeUpdate;
      (plugin as any).kernel = mockKernel;

      // Step 1: draft -> pending_approval (with guard passing)
      const step1 = {
        objectName: 'project',
        data: { status: 'pending_approval', complete: true, id: 'p1' },
        previousData: { status: 'draft', id: 'p1' },
        operation: 'update',
        user: { id: 'user1', roles: ['editor'] },
      };

      await handler(step1);
      expect(step1.data.status).toBe('pending_approval');

      // Step 2: pending_approval -> approved (with guard passing)
      const step2 = {
        objectName: 'project',
        data: { status: 'approved', id: 'p1' },
        previousData: { status: 'pending_approval', id: 'p1' },
        operation: 'update',
        user: { id: 'user2', roles: ['approver'] },
      };

      await handler(step2);
      expect(step2.data.status).toBe('approved');

      // Step 3: approved -> active
      const step3 = {
        objectName: 'project',
        data: { status: 'active', id: 'p1' },
        previousData: { status: 'approved', id: 'p1' },
        operation: 'update',
        user: { id: 'user1' },
      };

      await handler(step3);
      expect(step3.data.status).toBe('active');

      // Verify audit trail
      const trail = plugin.getAuditTrail({ objectName: 'project', recordId: 'p1' });
      expect(trail.length).toBe(3);
      expect(trail[0].previousState).toBe('draft');
      expect(trail[0].currentState).toBe('pending_approval');
      expect(trail[2].currentState).toBe('active');
    });
  });
});
