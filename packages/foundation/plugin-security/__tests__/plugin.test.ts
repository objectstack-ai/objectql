/**
 * ObjectQL Security Plugin - Integration Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLSecurityPlugin } from '../src/plugin';
import type { PermissionConfig } from '@objectql/types';

const ACCOUNTS_PERM: PermissionConfig = {
  name: 'accounts_perms',
  object: 'accounts',
  object_permissions: {
    read: ['member', 'admin'],
    create: ['admin'],
    update: ['admin'],
    delete: ['admin'],
  },
  field_permissions: {
    salary: { read: ['hr', 'admin'], update: ['admin'] },
    ssn: { read: ['admin'] },
  },
  field_masking: {
    phone: { mask_format: '****', visible_to: ['admin'] },
  },
  row_level_security: {
    enabled: true,
    default_rule: {
      type: 'formula',
      formula: "owner == $current_user.id",
    } as any,
    exceptions: [{ role: 'admin', bypass: true }],
  },
};

function createMockKernel() {
  const hooks: Record<string, Function[]> = {};
  return {
    security: undefined as any,
    use: jest.fn((hookName: string, handler: Function) => {
      if (!hooks[hookName]) hooks[hookName] = [];
      hooks[hookName].push(handler);
    }),
    _hooks: hooks,
    async triggerHook(name: string, context: any) {
      for (const h of hooks[name] || []) {
        await h(context);
      }
    },
  };
}

describe('ObjectQLSecurityPlugin', () => {
  // ----------------------------------------------------------
  // Construction & config validation
  // ----------------------------------------------------------
  describe('Construction', () => {
    it('should construct with default config', () => {
      const plugin = new ObjectQLSecurityPlugin();
      expect(plugin.name).toBe('@objectql/plugin-security');
    });

    it('should construct with custom config', () => {
      const plugin = new ObjectQLSecurityPlugin({
        enabled: false,
        cacheTTL: 5000,
      });
      expect(plugin.name).toBe('@objectql/plugin-security');
    });

    it('should reject invalid config via Zod', () => {
      expect(
        () => new ObjectQLSecurityPlugin({ cacheTTL: -1 } as any)
      ).toThrow();
    });
  });

  // ----------------------------------------------------------
  // Install
  // ----------------------------------------------------------
  describe('Install', () => {
    it('should install and register hooks when enabled', async () => {
      const plugin = new ObjectQLSecurityPlugin({
        permissions: [ACCOUNTS_PERM],
      });
      const kernel = createMockKernel();

      await plugin.install({ engine: kernel });

      expect(kernel.security).toBeDefined();
      expect(kernel.security.loader).toBeDefined();
      expect(kernel.security.guard).toBeDefined();
      expect(kernel.security.trimmer).toBeDefined();
      expect(kernel.security.masker).toBeDefined();

      // Hooks should be registered
      expect(kernel.use).toHaveBeenCalled();
      const hookNames = (kernel.use as jest.Mock).mock.calls.map((c: any[]) => c[0]);
      expect(hookNames).toContain('beforeQuery');
      expect(hookNames).toContain('beforeMutation');
      expect(hookNames).toContain('afterQuery');
    });

    it('should skip everything when disabled', async () => {
      const plugin = new ObjectQLSecurityPlugin({ enabled: false });
      const kernel = createMockKernel();

      await plugin.install({ engine: kernel });

      expect(kernel.security).toBeUndefined();
      expect(kernel.use).not.toHaveBeenCalled();
    });

    it('should register auth service when registerService is available', async () => {
      const plugin = new ObjectQLSecurityPlugin({
        permissions: [ACCOUNTS_PERM],
      });
      const kernel = createMockKernel();
      const registerService = jest.fn();

      await plugin.install({ engine: kernel, registerService });

      expect(registerService).toHaveBeenCalledWith('auth', expect.anything());
    });

    it('should not register hooks when RLS/FLS are disabled', async () => {
      const plugin = new ObjectQLSecurityPlugin({
        permissions: [ACCOUNTS_PERM],
        enableRowLevelSecurity: false,
        enableFieldLevelSecurity: false,
      });
      const kernel = createMockKernel();

      await plugin.install({ engine: kernel });

      const hookNames = (kernel.use as jest.Mock).mock.calls.map((c: any[]) => c[0]);
      expect(hookNames).not.toContain('beforeQuery');
      expect(hookNames).not.toContain('afterQuery');
      // beforeMutation is always registered
      expect(hookNames).toContain('beforeMutation');
    });
  });

  // ----------------------------------------------------------
  // beforeMutation hook (permission checks)
  // ----------------------------------------------------------
  describe('beforeMutation hook', () => {
    let kernel: ReturnType<typeof createMockKernel>;

    beforeEach(async () => {
      const plugin = new ObjectQLSecurityPlugin({
        permissions: [ACCOUNTS_PERM],
        throwOnDenied: true,
      });
      kernel = createMockKernel();
      await plugin.install({ engine: kernel });
    });

    it('should allow read for member role', async () => {
      const context = {
        objectName: 'accounts',
        operation: 'read',
        user: { id: 'u1', roles: ['member'] },
      };
      await expect(kernel.triggerHook('beforeMutation', context)).resolves.not.toThrow();
    });

    it('should deny create for member role', async () => {
      const context = {
        objectName: 'accounts',
        operation: 'create',
        user: { id: 'u1', roles: ['member'] },
      };
      await expect(kernel.triggerHook('beforeMutation', context)).rejects.toThrow('Permission denied');
    });

    it('should allow create for admin role', async () => {
      const context = {
        objectName: 'accounts',
        operation: 'create',
        user: { id: 'a1', roles: ['admin'] },
      };
      await expect(kernel.triggerHook('beforeMutation', context)).resolves.not.toThrow();
    });

    it('should skip when object is exempt', async () => {
      const plugin = new ObjectQLSecurityPlugin({
        permissions: [ACCOUNTS_PERM],
        exemptObjects: ['accounts'],
        throwOnDenied: true,
      });
      const k = createMockKernel();
      await plugin.install({ engine: k });

      const context = {
        objectName: 'accounts',
        operation: 'create',
        user: { id: 'u1', roles: ['member'] }, // would normally be denied
      };
      await expect(k.triggerHook('beforeMutation', context)).resolves.not.toThrow();
    });

    it('should skip when objectName is missing', async () => {
      const context = { operation: 'create', user: { id: 'u1', roles: [] } };
      await expect(kernel.triggerHook('beforeMutation', context)).resolves.not.toThrow();
    });

    it('should set context.skip when throwOnDenied is false', async () => {
      const plugin = new ObjectQLSecurityPlugin({
        permissions: [ACCOUNTS_PERM],
        throwOnDenied: false,
      });
      const k = createMockKernel();
      await plugin.install({ engine: k });

      const context: any = {
        objectName: 'accounts',
        operation: 'create',
        user: { id: 'u1', roles: ['member'] },
      };
      await k.triggerHook('beforeMutation', context);
      expect(context.skip).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // afterQuery hook (FLS masking)
  // ----------------------------------------------------------
  describe('afterQuery hook', () => {
    let kernel: ReturnType<typeof createMockKernel>;

    beforeEach(async () => {
      const plugin = new ObjectQLSecurityPlugin({
        permissions: [ACCOUNTS_PERM],
      });
      kernel = createMockKernel();
      await plugin.install({ engine: kernel });
    });

    it('should mask fields for unauthorized users', async () => {
      const context: any = {
        objectName: 'accounts',
        operation: 'read',
        user: { id: 'u1', roles: ['member'] },
        result: [
          { id: 1, name: 'Acme', salary: 100000, ssn: '123', phone: '555-1234' },
        ],
      };

      await kernel.triggerHook('afterQuery', context);

      // member cannot see salary or ssn
      expect(context.result[0]).not.toHaveProperty('salary');
      expect(context.result[0]).not.toHaveProperty('ssn');
      // phone is masked (not removed)
      expect(context.result[0].phone).not.toBe('555-1234');
      // name is preserved
      expect(context.result[0].name).toBe('Acme');
    });

    it('should handle single record result (non-array)', async () => {
      const context: any = {
        objectName: 'accounts',
        operation: 'read',
        user: { id: 'a1', roles: ['admin'] },
        result: { id: 1, name: 'Acme', salary: 100000, ssn: '123', phone: '555-1234' },
      };

      await kernel.triggerHook('afterQuery', context);

      // Admin sees everything unmasked
      expect(context.result.salary).toBe(100000);
      expect(context.result.ssn).toBe('123');
      expect(context.result.phone).toBe('555-1234');
    });

    it('should skip when no result', async () => {
      const context: any = {
        objectName: 'accounts',
        operation: 'read',
        user: { id: 'u1', roles: ['member'] },
      };
      // Should not throw
      await expect(kernel.triggerHook('afterQuery', context)).resolves.not.toThrow();
    });
  });

  // ----------------------------------------------------------
  // Audit logging
  // ----------------------------------------------------------
  describe('Audit logging', () => {
    it('should log permission checks when audit is enabled', async () => {
      const plugin = new ObjectQLSecurityPlugin({
        permissions: [ACCOUNTS_PERM],
        enableAudit: true,
        throwOnDenied: false,
      });
      const kernel = createMockKernel();
      await plugin.install({ engine: kernel });

      const context: any = {
        objectName: 'accounts',
        operation: 'create',
        user: { id: 'u1', roles: ['member'] },
      };

      await kernel.triggerHook('beforeMutation', context);

      const logs = plugin.getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].userId).toBe('u1');
      expect(logs[0].objectName).toBe('accounts');
      expect(logs[0].granted).toBe(false);
    });

    it('should limit audit log entries to 1000', async () => {
      const plugin = new ObjectQLSecurityPlugin({
        permissions: [ACCOUNTS_PERM],
        enableAudit: true,
        throwOnDenied: false,
      });
      const kernel = createMockKernel();
      await plugin.install({ engine: kernel });

      // Generate 1010 entries
      for (let i = 0; i < 1010; i++) {
        await kernel.triggerHook('beforeMutation', {
          objectName: 'accounts',
          operation: 'read',
          user: { id: `user${i}`, roles: ['member'] },
        });
      }

      const logs = plugin.getAuditLogs(2000);
      expect(logs.length).toBeLessThanOrEqual(1000);
    });

    it('should clear audit logs', async () => {
      const plugin = new ObjectQLSecurityPlugin({
        permissions: [ACCOUNTS_PERM],
        enableAudit: true,
        throwOnDenied: false,
      });
      const kernel = createMockKernel();
      await plugin.install({ engine: kernel });

      await kernel.triggerHook('beforeMutation', {
        objectName: 'accounts',
        operation: 'read',
        user: { id: 'u1', roles: ['member'] },
      });

      expect(plugin.getAuditLogs().length).toBeGreaterThan(0);
      plugin.clearAuditLogs();
      expect(plugin.getAuditLogs().length).toBe(0);
    });
  });

  // ----------------------------------------------------------
  // init / start adapter methods
  // ----------------------------------------------------------
  describe('Adapter methods', () => {
    it('init should call install', async () => {
      const plugin = new ObjectQLSecurityPlugin({
        permissions: [ACCOUNTS_PERM],
      });
      const kernel = createMockKernel();
      await plugin.init(kernel);
      expect(kernel.security).toBeDefined();
    });

    it('start should resolve without error', async () => {
      const plugin = new ObjectQLSecurityPlugin();
      await expect(plugin.start({} as any)).resolves.not.toThrow();
    });
  });
});
