/**
 * ObjectStackRuntimeProtocol Tests
 * 
 * This file demonstrates the testing pattern for the protocol bridge layer.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectStackRuntimeProtocol, ObjectStackKernel } from '../index';

describe('ObjectStackRuntimeProtocol', () => {
  let kernel: ObjectStackKernel;
  let protocol: ObjectStackRuntimeProtocol;

  beforeEach(() => {
    // Create a fresh kernel for each test
    kernel = new ObjectStackKernel([]);
    
    // Register some test metadata
    kernel.metadata.register('object', 'users', {
      name: 'users',
      fields: {
        name: { type: 'text' },
        email: { type: 'email' }
      }
    });
    
    kernel.metadata.register('object', 'projects', {
      name: 'projects',
      fields: {
        title: { type: 'text' },
        status: { type: 'select', options: ['active', 'archived'] }
      }
    });

    // Create protocol instance
    protocol = new ObjectStackRuntimeProtocol(kernel);
  });

  describe('Metadata Methods', () => {
    it('should get all meta types', () => {
      const types = protocol.getMetaTypes();
      expect(types).toEqual(['users', 'projects']);
    });

    it('should get metadata for a specific object', () => {
      const metadata = protocol.getMetaItem('users') as any;
      expect(metadata).toBeDefined();
      expect(metadata.name).toBe('users');
      expect(metadata.fields).toHaveProperty('name');
      expect(metadata.fields).toHaveProperty('email');
    });

    it('should check if object exists', () => {
      expect(protocol.hasObject('users')).toBe(true);
      expect(protocol.hasObject('nonexistent')).toBe(false);
    });

    it('should get all metadata items of a type', () => {
      const allObjects = protocol.getAllMetaItems('object');
      expect(allObjects.size).toBe(2);
      expect(allObjects.has('users')).toBe(true);
      expect(allObjects.has('projects')).toBe(true);
    });
  });

  describe('Data Query Methods', () => {
    beforeEach(async () => {
      // Mock kernel methods
      vi.spyOn(kernel, 'find').mockResolvedValue({
        value: [
          { id: '1', name: 'Alice', email: 'alice@example.com' },
          { id: '2', name: 'Bob', email: 'bob@example.com' }
        ],
        count: 2
      });

      vi.spyOn(kernel, 'get').mockResolvedValue({
        id: '1',
        name: 'Alice',
        email: 'alice@example.com'
      });
    });

    it('should find data with query', async () => {
      const result = await protocol.findData('users', {
        where: { name: 'Alice' }
      });

      expect(result.value).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(kernel.find).toHaveBeenCalledWith('users', {
        where: { name: 'Alice' }
      });
    });

    it('should find data without query', async () => {
      const result = await protocol.findData('users');

      expect(result.value).toHaveLength(2);
      expect(kernel.find).toHaveBeenCalledWith('users', {});
    });

    it('should get single data by id', async () => {
      const data = await protocol.getData('users', '1');

      expect(data.id).toBe('1');
      expect(data.name).toBe('Alice');
      expect(kernel.get).toHaveBeenCalledWith('users', '1');
    });

    it('should count data with filters', async () => {
      const count = await protocol.countData('users', { active: true });

      expect(count).toBe(2);
      expect(kernel.find).toHaveBeenCalledWith('users', {
        where: { active: true }
      });
    });
  });

  describe('Data Mutation Methods', () => {
    beforeEach(() => {
      vi.spyOn(kernel, 'create').mockResolvedValue({
        id: '3',
        name: 'Charlie',
        email: 'charlie@example.com'
      });

      vi.spyOn(kernel, 'update').mockResolvedValue({
        id: '1',
        name: 'Alice Updated',
        email: 'alice.new@example.com'
      });

      vi.spyOn(kernel, 'delete').mockResolvedValue(true);
    });

    it('should create data', async () => {
      const newUser = {
        name: 'Charlie',
        email: 'charlie@example.com'
      };

      const result = await protocol.createData('users', newUser);

      expect(result.id).toBe('3');
      expect(result.name).toBe('Charlie');
      expect(kernel.create).toHaveBeenCalledWith('users', newUser);
    });

    it('should update data', async () => {
      const updates = {
        name: 'Alice Updated',
        email: 'alice.new@example.com'
      };

      const result = await protocol.updateData('users', '1', updates);

      expect(result.name).toBe('Alice Updated');
      expect(kernel.update).toHaveBeenCalledWith('users', '1', updates);
    });

    it('should delete data', async () => {
      const result = await protocol.deleteData('users', '1');

      expect(result).toBe(true);
      expect(kernel.delete).toHaveBeenCalledWith('users', '1');
    });
  });

  describe('View & Action Methods', () => {
    beforeEach(() => {
      vi.spyOn(kernel, 'getView').mockReturnValue({
        type: 'list',
        columns: ['name', 'email']
      });

      vi.spyOn(kernel.actions, 'execute').mockResolvedValue({
        success: true,
        message: 'Action executed'
      });

      vi.spyOn(kernel.actions, 'list').mockReturnValue([
        'sendEmail',
        'exportData'
      ]);
    });

    it('should get view config', () => {
      const viewConfig = protocol.getViewConfig('users', 'list');

      expect(viewConfig).toBeDefined();
      expect(kernel.getView).toHaveBeenCalledWith('users', 'list');
    });

    it('should execute action', async () => {
      const result = await protocol.executeAction('sendEmail', {
        to: 'user@example.com'
      });

      expect(result.success).toBe(true);
      expect(kernel.actions.execute).toHaveBeenCalledWith('sendEmail', {
        to: 'user@example.com'
      });
    });

    it('should list actions', () => {
      const actions = protocol.getActions();

      expect(actions).toEqual(['sendEmail', 'exportData']);
      expect(kernel.actions.list).toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    it('should get kernel instance', () => {
      const kernelInstance = protocol.getKernel();

      expect(kernelInstance).toBe(kernel);
    });
  });
});
