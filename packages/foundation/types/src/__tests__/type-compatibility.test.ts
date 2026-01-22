/**
 * Type Compatibility Tests for @objectql/types v4.0
 * 
 * These tests ensure backward compatibility with v3.x while
 * validating the new v4.0 import patterns.
 */

// ============================================================================
// TEST 1: Query-Specific Types (Should always work from @objectql/types)
// ============================================================================

import type { 
  UnifiedQuery, 
  Filter, 
  AggregateOption,
  IntrospectedTable
} from '../index';

describe('@objectql/types v4.0 - Type Compatibility', () => {
  it('should support UnifiedQuery type', () => {
    const testQuery: UnifiedQuery = {
      fields: ['id', 'name', 'email'],
      filters: {
        status: 'active',
        age: { $gte: 18 }
      },
      sort: [['created_at', 'desc']],
      skip: 0,
      limit: 10
    };
    
    expect(testQuery).toBeDefined();
    expect(testQuery.fields).toHaveLength(3);
  });

  it('should support Filter type', () => {
    const testFilter: Filter = {
      $and: [
        { status: 'active' },
        { age: { $gte: 18, $lte: 65 } }
      ]
    };
    
    expect(testFilter).toBeDefined();
  });

  it('should support AggregateOption type', () => {
    const testAggregation: AggregateOption = {
      func: 'sum',
      field: 'amount',
      alias: 'total_amount'
    };
    
    expect(testAggregation.func).toBe('sum');
  });

  it('should support IntrospectedTable type', () => {
    const testTable: IntrospectedTable = {
      name: 'users',
      columns: [
        {
          name: 'id',
          type: 'integer',
          nullable: false,
          isPrimary: true
        }
      ],
      foreignKeys: []
    };
    
    expect(testTable.name).toBe('users');
    expect(testTable.columns).toHaveLength(1);
  });
});

// ============================================================================
// TEST 2: Re-exported Types (Deprecated but should still work)
// ============================================================================

import type { FilterCondition, RuntimePlugin } from '../index';

describe('@objectql/types v4.0 - Deprecated Re-exports', () => {
  it('should support FilterCondition re-export (deprecated)', () => {
    const testFilterCondition: FilterCondition = {
      field: 'status',
      operator: '=',
      value: 'active'
    };
    
    expect(testFilterCondition.field).toBe('status');
  });

  it('should support RuntimePlugin re-export (deprecated)', () => {
    const testPlugin: RuntimePlugin = {
      name: 'test-plugin',
      async install() {},
      async onStart() {}
    };
    
    expect(testPlugin.name).toBe('test-plugin');
  });
});
