/**
 * Formula Engine Tests
 * 
 * Comprehensive test suite for the FormulaEngine class
 */

import { FormulaEngine } from '../src/formula-engine';
import {
  FormulaContext,
} from '@objectql/types';

describe('FormulaEngine', () => {
  let engine: FormulaEngine;
  let baseContext: FormulaContext;

  beforeEach(() => {
    engine = new FormulaEngine();
    
    // Create a base context for testing
    const now = new Date('2026-01-15T12:30:45Z');
    baseContext = {
      record: {
        name: 'Test User',
        quantity: 10,
        unit_price: 25.5,
        discount_rate: 0.1,
        is_active: true,
        created_at: new Date('2026-01-01'),
      },
      system: {
        today: new Date('2026-01-15'),
        now: now,
        year: 2026,
        month: 1,
        day: 15,
        hour: 12,
        minute: 30,
        second: 45,
      },
      current_user: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
      },
      is_new: false,
      record_id: 'record-456',
    };
  });

  describe('Basic Arithmetic', () => {
    it('should evaluate simple addition', () => {
      const result = engine.evaluate('5 + 3', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(8);
    });

    it('should evaluate subtraction', () => {
      const result = engine.evaluate('10 - 3', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(7);
    });

    it('should evaluate multiplication', () => {
      const result = engine.evaluate('4 * 5', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(20);
    });

    it('should evaluate division', () => {
      const result = engine.evaluate('20 / 4', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(5);
    });

    it('should evaluate modulo', () => {
      const result = engine.evaluate('10 % 3', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(1);
    });

    it('should evaluate exponentiation', () => {
      const result = engine.evaluate('2 ** 3', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(8);
    });

    it('should handle complex arithmetic expressions', () => {
      const result = engine.evaluate('(5 + 3) * 2 - 4', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(12);
    });
  });

  describe('Field References', () => {
    it('should access field values', () => {
      const result = engine.evaluate('quantity', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should perform calculations with field references', () => {
      const result = engine.evaluate('quantity * unit_price', baseContext, 'currency');
      expect(result.success).toBe(true);
      expect(result.value).toBe(255); // 10 * 25.5
    });

    it('should handle complex field calculations', () => {
      const result = engine.evaluate(
        'quantity * unit_price * (1 - discount_rate)',
        baseContext,
        'currency'
      );
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(229.5, 1); // 255 * 0.9
    });
  });

  describe('String Operations', () => {
    it('should concatenate strings', () => {
      const context = {
        ...baseContext,
        record: {
          ...baseContext.record,
          first_name: 'John',
          last_name: 'Doe',
        },
      };
      const result = engine.evaluate('first_name + " " + last_name', context, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('John Doe');
    });

    it('should handle template literals', () => {
      const context = {
        ...baseContext,
        record: { ...baseContext.record, first_name: 'Jane' },
      };
      const result = engine.evaluate('`Hello, ${first_name}!`', context, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('Hello, Jane!');
    });

    it('should convert to uppercase', () => {
      const result = engine.evaluate('name.toUpperCase()', baseContext, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('TEST USER');
    });

    it('should convert to lowercase', () => {
      const result = engine.evaluate('name.toLowerCase()', baseContext, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('test user');
    });

    it('should get string length', () => {
      const result = engine.evaluate('name.length', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(9); // "Test User"
    });

    it('should extract substring', () => {
      const result = engine.evaluate('name.substring(0, 4)', baseContext, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('Test');
    });

    it('should get character at index', () => {
      const result = engine.evaluate('name.charAt(0)', baseContext, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('T');
    });
  });

  describe('Comparison Operators', () => {
    it('should compare with >', () => {
      const result = engine.evaluate('quantity > 5', baseContext, 'boolean');
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should compare with <', () => {
      const result = engine.evaluate('quantity < 5', baseContext, 'boolean');
      expect(result.success).toBe(true);
      expect(result.value).toBe(false);
    });

    it('should compare with ===', () => {
      const result = engine.evaluate('quantity === 10', baseContext, 'boolean');
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should compare with !==', () => {
      const result = engine.evaluate('quantity !== 5', baseContext, 'boolean');
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should compare with >=', () => {
      const result = engine.evaluate('quantity >= 10', baseContext, 'boolean');
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should compare with <=', () => {
      const result = engine.evaluate('quantity <= 10', baseContext, 'boolean');
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });
  });

  describe('Logical Operators', () => {
    it('should evaluate AND operator', () => {
      const result = engine.evaluate('quantity > 5 && is_active', baseContext, 'boolean');
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should evaluate OR operator', () => {
      const result = engine.evaluate('quantity < 5 || is_active', baseContext, 'boolean');
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should evaluate NOT operator', () => {
      const result = engine.evaluate('!is_active', baseContext, 'boolean');
      expect(result.success).toBe(true);
      expect(result.value).toBe(false);
    });
  });

  describe('Conditional Expressions', () => {
    it('should evaluate ternary operator', () => {
      const result = engine.evaluate(
        'is_active ? "Active" : "Inactive"',
        baseContext,
        'text'
      );
      expect(result.success).toBe(true);
      expect(result.value).toBe('Active');
    });

    it('should handle nested ternary', () => {
      const result = engine.evaluate(
        'quantity > 100 ? "High" : (quantity > 10 ? "Medium" : "Low")',
        baseContext,
        'text'
      );
      expect(result.success).toBe(true);
      expect(result.value).toBe('Low');
    });

    it('should handle if-else statements', () => {
      const expression = `
        if (quantity > 50) {
          return "High";
        } else if (quantity > 10) {
          return "Medium";
        } else {
          return "Low";
        }
      `;
      const result = engine.evaluate(expression, baseContext, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('Low');
    });
  });

  describe('System Variables', () => {
    it('should access $today', () => {
      const result = engine.evaluate('$today', baseContext, 'date');
      expect(result.success).toBe(true);
      expect(result.value).toEqual(new Date('2026-01-15'));
    });

    it('should access $now', () => {
      const result = engine.evaluate('$now', baseContext, 'datetime');
      expect(result.success).toBe(true);
      expect(result.value).toEqual(new Date('2026-01-15T12:30:45Z'));
    });

    it('should access $year', () => {
      const result = engine.evaluate('$year', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(2026);
    });

    it('should access $month', () => {
      const result = engine.evaluate('$month', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(1);
    });

    it('should access $current_user.id', () => {
      const result = engine.evaluate('$current_user.id', baseContext, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('user-123');
    });

    it('should access $current_user.name', () => {
      const result = engine.evaluate('$current_user.name', baseContext, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('John Doe');
    });

    it('should access $is_new', () => {
      const result = engine.evaluate('$is_new', baseContext, 'boolean');
      expect(result.success).toBe(true);
      expect(result.value).toBe(false);
    });
  });

  describe('Math Functions', () => {
    it('should use Math.round', () => {
      const result = engine.evaluate('Math.round(25.7)', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(26);
    });

    it('should use Math.ceil', () => {
      const result = engine.evaluate('Math.ceil(25.1)', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(26);
    });

    it('should use Math.floor', () => {
      const result = engine.evaluate('Math.floor(25.9)', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(25);
    });

    it('should use Math.abs', () => {
      const result = engine.evaluate('Math.abs(-10)', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should use Math.max', () => {
      const result = engine.evaluate('Math.max(5, 10, 3)', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should use Math.min', () => {
      const result = engine.evaluate('Math.min(5, 10, 3)', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(3);
    });

    it('should use Math.pow', () => {
      const result = engine.evaluate('Math.pow(2, 3)', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(8);
    });

    it('should use Math.sqrt', () => {
      const result = engine.evaluate('Math.sqrt(16)', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(4);
    });
  });

  describe('Date Functions', () => {
    it('should get year from date', () => {
      const result = engine.evaluate('created_at.getFullYear()', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(2026);
    });

    it('should get month from date', () => {
      const result = engine.evaluate('created_at.getMonth()', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(0); // January is 0
    });

    it('should get day from date', () => {
      const result = engine.evaluate('created_at.getDate()', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(1);
    });
  });

  describe('Null Handling', () => {
    it('should handle null values', () => {
      const context = {
        ...baseContext,
        record: { ...baseContext.record, optional_field: null },
      };
      const result = engine.evaluate('optional_field ?? "default"', context, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('default');
    });

    it('should handle undefined values', () => {
      const context = {
        ...baseContext,
        record: { ...baseContext.record, optional_field: undefined },
      };
      const result = engine.evaluate('optional_field ?? "default"', context, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('default');
    });

    it('should handle logical OR for null', () => {
      const context = {
        ...baseContext,
        record: { ...baseContext.record, value: null },
      };
      const result = engine.evaluate('value || 0', context, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(0);
    });
  });

  describe('Type Coercion', () => {
    it('should coerce string to number', () => {
      const context = {
        ...baseContext,
        record: { ...baseContext.record, text_value: '42' },
      };
      const result = engine.evaluate('text_value', context, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(42);
    });

    it('should coerce number to text', () => {
      const result = engine.evaluate('quantity', baseContext, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('10');
    });

    it('should coerce boolean to number', () => {
      const result = engine.evaluate('is_active', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(1);
    });

    it('should handle invalid number conversion', () => {
      const context = {
        ...baseContext,
        record: { ...baseContext.record, invalid: 'not-a-number' },
      };
      const result = engine.evaluate('invalid', context, 'number');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot convert');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty expression', () => {
      const result = engine.evaluate('', baseContext, 'number');
      expect(result.success).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should handle syntax error', () => {
      const result = engine.evaluate('5 +', baseContext, 'number');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle division by zero', () => {
      const result = engine.evaluate('10 / 0', baseContext, 'number');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Infinity');
    });

    it('should handle undefined field reference', () => {
      const result = engine.evaluate('nonexistent_field', baseContext, 'number');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should detect blocked operations', () => {
      const result = engine.evaluate('eval("malicious code")', baseContext, 'text');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Blocked operation');
    });
  });

  describe('Complex Business Logic', () => {
    it('should calculate commission rate', () => {
      const context = {
        ...baseContext,
        record: { ...baseContext.record, sales_total: 75000 },
      };
      const expression = `
        if (sales_total > 100000) {
          return 0.15;
        } else if (sales_total > 50000) {
          return 0.10;
        } else if (sales_total > 10000) {
          return 0.05;
        } else {
          return 0.02;
        }
      `;
      const result = engine.evaluate(expression, context, 'percent');
      expect(result.success).toBe(true);
      expect(result.value).toBe(0.10);
    });

    it('should calculate risk score', () => {
      const context = {
        ...baseContext,
        record: {
          ...baseContext.record,
          customer: {
            credit_score: 650,
            payment_history: 'fair',
          },
          amount: 60000,
        },
      };
      const expression = `
        let score = 0;
        if (customer.credit_score < 600) {
          score += 40;
        } else if (customer.credit_score < 700) {
          score += 20;
        }
        if (amount > 100000) {
          score += 30;
        } else if (amount > 50000) {
          score += 15;
        }
        if (customer.payment_history === 'poor') {
          score += 30;
        } else if (customer.payment_history === 'fair') {
          score += 15;
        }
        return score;
      `;
      const result = engine.evaluate(expression, context, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(50); // 20 + 15 + 15
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract dependencies from simple expression', () => {
      const metadata = engine.extractMetadata(
        'total',
        'quantity * unit_price',
        'currency'
      );
      expect(metadata.field_name).toBe('total');
      expect(metadata.dependencies).toContain('quantity');
      expect(metadata.dependencies).toContain('unit_price');
      expect(metadata.is_valid).toBe(true);
      expect(metadata.complexity).toBe('simple');
    });

    it('should extract system variables', () => {
      const metadata = engine.extractMetadata(
        'age',
        '$today - birth_date',
        'number'
      );
      expect(metadata.system_variables).toContain('$today');
      expect(metadata.dependencies).toContain('birth_date');
    });

    it('should extract lookup chains', () => {
      const metadata = engine.extractMetadata(
        'owner_name',
        'account.owner.name',
        'text'
      );
      expect(metadata.lookup_chains).toContain('account.owner.name');
    });

    it('should estimate complexity', () => {
      const simpleMetadata = engine.extractMetadata(
        'total',
        'a + b',
        'number'
      );
      expect(simpleMetadata.complexity).toBe('simple');

      const mediumMetadata = engine.extractMetadata(
        'status',
        'value > 10 ? "high" : "low"',
        'text'
      );
      expect(mediumMetadata.complexity).toBe('medium');

      const complexMetadata = engine.extractMetadata(
        'score',
        `
          if (a > 10) {
            return 100;
          } else if (a > 5) {
            return 50;
          } else {
            return 0;
          }
        `,
        'number'
      );
      expect(complexMetadata.complexity).toBe('medium');
    });
  });

  describe('Custom Functions', () => {
    it('should register and use custom function', () => {
      engine.registerFunction('DOUBLE', (x: number) => x * 2);
      const result = engine.evaluate('DOUBLE(5)', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should use multiple custom functions', () => {
      engine.registerFunction('ADD', (a: number, b: number) => a + b);
      engine.registerFunction('MULTIPLY', (a: number, b: number) => a * b);
      const result = engine.evaluate('MULTIPLY(ADD(3, 2), 4)', baseContext, 'number');
      expect(result.success).toBe(true);
      expect(result.value).toBe(20);
    });
  });

  describe('Validation', () => {
    it('should validate valid expression', () => {
      const validation = engine.validate('quantity * unit_price');
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect syntax errors', () => {
      const validation = engine.validate('5 +');
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect empty expression', () => {
      const validation = engine.validate('');
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Expression cannot be empty');
    });

    it('should detect blocked operations', () => {
      const validation = engine.validate('eval("code")');
      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Blocked operation'))).toBe(true);
    });
  });

  describe('Real-world Examples', () => {
    it('should calculate e-commerce final price', () => {
      const context = {
        ...baseContext,
        record: {
          ...baseContext.record,
          list_price: 100,
          discount_rate: 0.2,
          tax_rate: 0.08,
        },
      };
      const result = engine.evaluate(
        'list_price * (1 - discount_rate) * (1 + tax_rate)',
        context,
        'currency'
      );
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(86.4, 1); // 100 * 0.8 * 1.08
    });

    it('should classify account tier', () => {
      const context = {
        ...baseContext,
        record: { ...baseContext.record, annual_revenue: 5000000 },
      };
      const expression = `
        if (annual_revenue > 10000000) return 'Enterprise';
        if (annual_revenue > 1000000) return 'Corporate';
        if (annual_revenue > 100000) return 'SMB';
        return 'Startup';
      `;
      const result = engine.evaluate(expression, context, 'text');
      expect(result.success).toBe(true);
      expect(result.value).toBe('Corporate');
    });

    it('should calculate full name', () => {
      const context = {
        ...baseContext,
        record: {
          ...baseContext.record,
          first_name: 'Jane',
          last_name: 'Smith',
        },
      };
      const result = engine.evaluate(
        'first_name + " " + last_name',
        context,
        'text'
      );
      expect(result.success).toBe(true);
      expect(result.value).toBe('Jane Smith');
    });

    it('should check if user is owner', () => {
      const context = {
        ...baseContext,
        record: { ...baseContext.record, owner_id: 'user-123' },
      };
      const result = engine.evaluate(
        'owner_id === $current_user.id',
        context,
        'boolean'
      );
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });
  });
});
