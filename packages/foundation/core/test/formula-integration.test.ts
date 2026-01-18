/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Formula Integration Tests
 * 
 * Tests formula evaluation within repository queries
 */

import { ObjectQL } from '../src/app';
import { MockDriver } from './mock-driver';

describe('Formula Integration', () => {
  let app: ObjectQL;
  let mockDriver: MockDriver;

  beforeEach(async () => {
    mockDriver = new MockDriver();
    
    app = new ObjectQL({
      datasources: {
        default: mockDriver
      }
    });

    // Register an object with formula fields
    app.registerObject({
      name: 'contact',
      fields: {
        first_name: {
          type: 'text',
          required: true,
        },
        last_name: {
          type: 'text',
          required: true,
        },
        full_name: {
          type: 'formula',
          formula: 'first_name + " " + last_name',
          data_type: 'text',
          label: 'Full Name',
        },
        quantity: {
          type: 'number',
        },
        unit_price: {
          type: 'currency',
        },
        total: {
          type: 'formula',
          formula: 'quantity * unit_price',
          data_type: 'currency',
          label: 'Total',
        },
        is_active: {
          type: 'boolean',
        },
        status_label: {
          type: 'formula',
          formula: 'is_active ? "Active" : "Inactive"',
          data_type: 'text',
          label: 'Status',
        },
      },
    });

    await app.init();
  });

  describe('Formula Evaluation in Queries', () => {
    it('should evaluate formula fields in find results', async () => {
      // Setup mock data
      mockDriver.setMockData('contact', [
        {
          _id: '1',
          first_name: 'John',
          last_name: 'Doe',
          quantity: 10,
          unit_price: 25.5,
          is_active: true,
        },
        {
          _id: '2',
          first_name: 'Jane',
          last_name: 'Smith',
          quantity: 5,
          unit_price: 30,
          is_active: false,
        },
      ]);

      const ctx = app.createContext({ isSystem: true });
      const results = await ctx.object('contact').find({});

      expect(results).toHaveLength(2);
      
      // Check first record
      expect(results[0].full_name).toBe('John Doe');
      expect(results[0].total).toBe(255); // 10 * 25.5
      expect(results[0].status_label).toBe('Active');

      // Check second record
      expect(results[1].full_name).toBe('Jane Smith');
      expect(results[1].total).toBe(150); // 5 * 30
      expect(results[1].status_label).toBe('Inactive');
    });

    it('should evaluate formula fields in findOne result', async () => {
      mockDriver.setMockData('contact', [
        {
          _id: '1',
          first_name: 'John',
          last_name: 'Doe',
          quantity: 10,
          unit_price: 25.5,
          is_active: true,
        },
      ]);

      const ctx = app.createContext({ isSystem: true });
      const result = await ctx.object('contact').findOne('1');

      expect(result).toBeDefined();
      expect(result.full_name).toBe('John Doe');
      expect(result.total).toBe(255);
      expect(result.status_label).toBe('Active');
    });

    it('should handle null values in formulas', async () => {
      mockDriver.setMockData('contact', [
        {
          _id: '1',
          first_name: 'John',
          last_name: 'Doe',
          quantity: null,
          unit_price: 25.5,
          is_active: true,
        },
      ]);

      const ctx = app.createContext({ isSystem: true });
      const result = await ctx.object('contact').findOne('1');

      expect(result).toBeDefined();
      expect(result.full_name).toBe('John Doe');
      // In JavaScript, null * number = 0 (null is coerced to 0)
      expect(result.total).toBe(0);
    });
  });

  describe('Complex Formula Examples', () => {
    beforeEach(async () => {
      // Register an object with more complex formulas
      app.registerObject({
        name: 'order',
        fields: {
          subtotal: { type: 'currency' },
          discount_rate: { type: 'percent' },
          tax_rate: { type: 'percent' },
          final_price: {
            type: 'formula',
            formula: 'subtotal * (1 - discount_rate / 100) * (1 + tax_rate / 100)',
            data_type: 'currency',
            label: 'Final Price',
          },
          created_at: { type: 'date' },
          status: { type: 'select', options: ['draft', 'confirmed', 'shipped'] },
          risk_level: {
            type: 'formula',
            formula: `
              if (subtotal > 10000) {
                return 'High';
              } else if (subtotal > 1000) {
                return 'Medium';
              } else {
                return 'Low';
              }
            `,
            data_type: 'text',
          },
        },
      });

      await app.init();
    });

    it('should calculate complex financial formulas', async () => {
      mockDriver.setMockData('order', [
        {
          _id: '1',
          subtotal: 5000,
          discount_rate: 10,
          tax_rate: 8,
          status: 'confirmed',
          created_at: new Date('2026-01-01'),
        },
      ]);

      const ctx = app.createContext({ isSystem: true });
      const result = await ctx.object('order').findOne('1');

      expect(result).toBeDefined();
      expect(result.final_price).toBeCloseTo(4860, 1);
      expect(result.risk_level).toBe('Medium');
    });

    it('should handle conditional logic in formulas', async () => {
      mockDriver.setMockData('order', [
        {
          _id: '1',
          subtotal: 500,
          discount_rate: 0,
          tax_rate: 0,
          status: 'draft',
          created_at: new Date('2026-01-01'),
        },
        {
          _id: '2',
          subtotal: 5000,
          discount_rate: 0,
          tax_rate: 0,
          status: 'confirmed',
          created_at: new Date('2026-01-01'),
        },
        {
          _id: '3',
          subtotal: 15000,
          discount_rate: 0,
          tax_rate: 0,
          status: 'shipped',
          created_at: new Date('2026-01-01'),
        },
      ]);

      const ctx = app.createContext({ isSystem: true });
      const results = await ctx.object('order').find({});

      expect(results[0].risk_level).toBe('Low');
      expect(results[1].risk_level).toBe('Medium');
      expect(results[2].risk_level).toBe('High');
    });
  });

  describe('Formula Error Handling', () => {
    beforeEach(async () => {
      app.registerObject({
        name: 'product',
        fields: {
          name: { type: 'text' },
          price: { type: 'currency' },
          invalid_formula: {
            type: 'formula',
            formula: 'nonexistent_field * 2',
            data_type: 'number',
          },
        },
      });

      await app.init();
    });

    it('should handle formula evaluation errors gracefully', async () => {
      mockDriver.setMockData('product', [
        {
          _id: '1',
          name: 'Widget',
          price: 100,
        },
      ]);

      const ctx = app.createContext({ isSystem: true });
      const result = await ctx.object('product').findOne('1');

      expect(result).toBeDefined();
      expect(result.name).toBe('Widget');
      // Formula failed, should be null
      expect(result.invalid_formula).toBeNull();
    });
  });
});
