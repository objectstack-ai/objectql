/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Formula Specification Compliance Tests
 * 
 * Ensures that formula fields work according to the latest specification,
 * supporting both 'expression' (spec-compliant) and 'formula' (legacy) properties.
 */

import { FormulaEngine } from '../src/formula-engine';
import type { FormulaContext } from '@objectql/types';

describe('Formula Specification Compliance', () => {
  let engine: FormulaEngine;
  let baseContext: FormulaContext;

  beforeEach(() => {
    engine = new FormulaEngine();
    
    const now = new Date('2026-01-25T10:00:00Z');
    baseContext = {
      record: {
        first_name: 'John',
        last_name: 'Doe',
        quantity: 10,
        unit_price: 25.5,
      },
      system: {
        today: new Date('2026-01-25'),
        now: now,
        year: 2026,
        month: 1,
        day: 25,
        hour: 10,
        minute: 0,
        second: 0,
      },
      current_user: {
        id: 'user-123',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      },
      is_new: false,
      record_id: 'rec-456',
    };
  });

  describe('Specification-compliant property: expression', () => {
    it('should evaluate formula using "expression" property', () => {
      const result = engine.evaluate(
        'first_name + " " + last_name',
        baseContext,
        'text'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('John Doe');
    });

    it('should calculate numeric formulas using "expression"', () => {
      const result = engine.evaluate(
        'quantity * unit_price',
        baseContext,
        'currency'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(255);
    });

    it('should support system variables in expression', () => {
      const result = engine.evaluate(
        '$year',
        baseContext,
        'number'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(2026);
    });

    it('should support conditional expressions', () => {
      const result = engine.evaluate(
        'quantity > 5 ? "High" : "Low"',
        baseContext,
        'text'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('High');
    });
  });

  describe('Specification examples from formula.mdx', () => {
    it('should calculate full_name as per spec example', () => {
      // From spec line 105-110
      const result = engine.evaluate(
        'first_name + " " + last_name',
        baseContext,
        'text'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('John Doe');
    });

    it('should calculate total_amount with formula fields', () => {
      // From spec: total_amount: expression: "quantity * unit_price"
      const result = engine.evaluate(
        'quantity * unit_price',
        baseContext,
        'currency'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(255);
    });

    it('should handle template literals', () => {
      // From spec line 216-218
      const result = engine.evaluate(
        '`Hello, ${first_name}!`',
        baseContext,
        'text'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('Hello, John!');
    });

    it('should support Math functions', () => {
      // From spec line 435-438
      const context = {
        ...baseContext,
        record: { ...baseContext.record, price: 99.7 }
      };
      
      const result = engine.evaluate(
        'Math.round(price)',
        context,
        'number'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(100);
    });
  });

  describe('Error handling per specification', () => {
    it('should handle division by zero safely', () => {
      // From spec section 7.1
      const context = {
        ...baseContext,
        record: { total: 100, count: 0 }
      };
      
      const result = engine.evaluate(
        'count !== 0 ? total / count : 0',
        context,
        'number'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });

    it('should detect division by zero without guard', () => {
      const context = {
        ...baseContext,
        record: { total: 100, count: 0 }
      };
      
      const result = engine.evaluate(
        'total / count',
        context,
        'number'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Infinity');
    });

    it('should handle null values with optional chaining', () => {
      // From spec section 7.2
      const context = {
        ...baseContext,
        record: { account: null }
      };
      
      const result = engine.evaluate(
        'account?.name ?? "No Account"',
        context,
        'text'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('No Account');
    });
  });

  describe('Data type coercion per specification', () => {
    it('should coerce to number type', () => {
      const context = {
        ...baseContext,
        record: { text_value: '42' }
      };
      
      const result = engine.evaluate(
        'Number(text_value) || 0',
        context,
        'number'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(42);
    });

    it('should coerce to text type', () => {
      const context = {
        ...baseContext,
        record: { numeric_value: 123 }
      };
      
      const result = engine.evaluate(
        'String(numeric_value)',
        context,
        'text'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe('123');
    });

    it('should coerce to boolean type', () => {
      const context = {
        ...baseContext,
        record: { value: 1 }
      };
      
      const result = engine.evaluate(
        'Boolean(value)',
        context,
        'boolean'
      );
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });
  });
});
