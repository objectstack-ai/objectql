/**
 * Tests for Report Compiler
 */

import { ReportCompiler } from '../src/report-compiler';
import type { ReportDefinition } from '@objectql/metadata';

describe('ReportCompiler', () => {
  let compiler: ReportCompiler;

  beforeEach(() => {
    compiler = new ReportCompiler();
  });

  describe('compile', () => {
    it('should compile a simple tabular report', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [
          { field: 'name', label: 'Name' },
          { field: 'priority', label: 'Priority' }
        ]
      };

      const query = compiler.compile(report);

      expect(query.fields).toContain('name');
      expect(query.fields).toContain('priority');
      expect(query.expand).toBeUndefined();
    });

    it('should handle relationship fields with expand', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [
          { field: 'name', label: 'Task Name' },
          { field: 'project.name', label: 'Project Name' },
          { field: 'project.owner', label: 'Project Owner' }
        ]
      };

      const query = compiler.compile(report);

      expect(query.fields).toContain('name');
      expect(query.expand).toBeDefined();
      expect(query.expand?.project).toBeDefined();
      expect(query.expand?.project.fields).toContain('name');
      expect(query.expand?.project.fields).toContain('owner');
    });

    it('should handle nested relationship fields', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [
          { field: 'name', label: 'Task Name' },
          { field: 'project.owner.name', label: 'Owner Name' }
        ]
      };

      const query = compiler.compile(report);

      expect(query.fields).toContain('name');
      expect(query.expand?.project).toBeDefined();
      expect(query.expand?.project.expand?.owner).toBeDefined();
    });

    it('should compile summary report with grouping', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'summary',
        object: 'tasks',
        columns: [
          { field: 'project.name', label: 'Project' },
          { field: 'priority', label: 'Priority' }
        ],
        groupings: [
          { field: 'project.name', sort: 'asc' },
          { field: 'priority', sort: 'desc' }
        ],
        aggregations: [
          { field: 'id', function: 'count', label: 'Count' }
        ]
      };

      const query = compiler.compile(report);

      expect((query as any).groupBy).toEqual(['project.name', 'priority']);
      expect((query as any).aggregate).toBeDefined();
      expect((query as any).aggregate.id).toBe('count');
    });

    it('should include filters in compiled query', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [{ field: 'name', label: 'Name' }],
        filters: [
          ['completed', '=', false]
        ]
      };

      const query = compiler.compile(report);

      expect(query.filters).toBeDefined();
      expect(query.filters).toEqual([['completed', '=', false]]);
    });

    it('should include sort configuration', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [{ field: 'name', label: 'Name' }],
        sort: [
          ['due_date', 'asc'],
          ['priority', 'desc']
        ]
      };

      const query = compiler.compile(report);

      expect(query.sort).toBeDefined();
      expect(query.sort).toEqual([
        ['due_date', 'asc'],
        ['priority', 'desc']
      ]);
    });

    it('should skip hidden columns', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [
          { field: 'name', label: 'Name', visible: true },
          { field: 'internal_id', label: 'ID', visible: false },
          { field: 'priority', label: 'Priority' }
        ]
      };

      const query = compiler.compile(report);

      expect(query.fields).toContain('name');
      expect(query.fields).toContain('priority');
      expect(query.fields).not.toContain('internal_id');
    });
  });

  describe('validate', () => {
    it('should validate a valid report', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [{ field: 'name', label: 'Name' }]
      };

      const result = compiler.validate(report);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing name', () => {
      const report: any = {
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [{ field: 'name', label: 'Name' }]
      };

      const result = compiler.validate(report);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Report name is required');
    });

    it('should detect missing object', () => {
      const report: any = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        columns: [{ field: 'name', label: 'Name' }]
      };

      const result = compiler.validate(report);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Primary object is required');
    });

    it('should detect missing columns', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: []
      };

      const result = compiler.validate(report);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one column is required');
    });

    it('should validate summary report requirements', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'summary',
        object: 'tasks',
        columns: [{ field: 'name', label: 'Name' }]
      };

      const result = compiler.validate(report);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Summary reports require at least one grouping');
      expect(result.errors).toContain('Summary reports require at least one aggregation');
    });

    it('should validate matrix report requirements', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'matrix',
        object: 'tasks',
        columns: [{ field: 'name', label: 'Name' }]
      };

      const result = compiler.validate(report);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Matrix reports require matrix configuration');
    });

    it('should detect duplicate columns', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [
          { field: 'name', label: 'Name 1' },
          { field: 'name', label: 'Name 2' }
        ]
      };

      const result = compiler.validate(report);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate column fields'))).toBe(true);
    });
  });

  describe('compilePreview', () => {
    it('should limit results for preview', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [{ field: 'name', label: 'Name' }]
      };

      const query = compiler.compilePreview(report, 5);

      expect(query.limit).toBe(5);
    });

    it('should use default preview limit', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [{ field: 'name', label: 'Name' }]
      };

      const query = compiler.compilePreview(report);

      expect(query.limit).toBe(10);
    });
  });

  describe('optimize', () => {
    it('should add default limit for tabular reports', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [{ field: 'name', label: 'Name' }]
      };

      const query = compiler.compile(report);
      const optimized = compiler.optimize(query, report);

      expect(optimized.limit).toBe(1000);
    });

    it('should not override explicit limit', () => {
      const report: ReportDefinition = {
        name: 'test_report',
        label: 'Test Report',
        type: 'tabular',
        object: 'tasks',
        columns: [{ field: 'name', label: 'Name' }],
        limit: 50
      };

      const query = compiler.compile(report);
      const optimized = compiler.optimize(query, report);

      expect(optimized.limit).toBe(50);
    });
  });
});
