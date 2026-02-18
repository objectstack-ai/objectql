/**
 * @objectstack/plugin-objectql — Test Suite
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect } from 'vitest';
import { validateObjects, ValidationDiagnostic } from '../src/commands/objectql/validate';
import type { ObjectConfig } from '@objectql/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shorthand: create a minimal valid object config. */
function makeObject(name: string, fields: ObjectConfig['fields']): ObjectConfig {
  return { name, fields };
}

// ---------------------------------------------------------------------------
// validateObjects — pure logic tests (no oclif runtime needed)
// ---------------------------------------------------------------------------

describe('validateObjects', () => {
  it('returns no diagnostics for a valid object', () => {
    const objects: ObjectConfig[] = [
      makeObject('account', {
        name: { type: 'text' },
        email: { type: 'email', required: true },
      }),
    ];
    const diag = validateObjects(objects);
    expect(diag).toHaveLength(0);
  });

  it('reports error when object has no name', () => {
    const objects = [{ fields: { x: { type: 'text' } } }] as unknown as ObjectConfig[];
    const diag = validateObjects(objects);
    expect(diag).toHaveLength(1);
    expect(diag[0].severity).toBe('error');
    expect(diag[0].message).toContain('name');
  });

  it('reports error when object has no fields', () => {
    const objects: ObjectConfig[] = [makeObject('empty', {} as ObjectConfig['fields'])];
    const diag = validateObjects(objects);
    expect(diag.some((d) => d.severity === 'error' && d.message.includes('no fields'))).toBe(true);
  });

  it('reports error when field has no type', () => {
    const objects = [
      makeObject('broken', { bad: {} as ObjectConfig['fields'][string] }),
    ];
    const diag = validateObjects(objects);
    expect(diag.some((d) => d.field === 'bad' && d.message.includes('type'))).toBe(true);
  });

  it('reports error for lookup field missing reference_to', () => {
    const objects: ObjectConfig[] = [
      makeObject('contact', {
        account: { type: 'lookup' },
      }),
    ];
    const diag = validateObjects(objects);
    expect(
      diag.some(
        (d) =>
          d.field === 'account' &&
          d.severity === 'error' &&
          d.message.includes('reference'),
      ),
    ).toBe(true);
  });

  it('does NOT report error for lookup field with reference_to', () => {
    const objects: ObjectConfig[] = [
      makeObject('contact', {
        account: { type: 'lookup', reference_to: 'account' },
      }),
    ];
    const diag = validateObjects(objects);
    expect(diag).toHaveLength(0);
  });

  it('does NOT report error for lookup field with reference (protocol field)', () => {
    const objects: ObjectConfig[] = [
      makeObject('contact', {
        account: { type: 'lookup', reference: 'account' },
      }),
    ];
    const diag = validateObjects(objects);
    expect(diag).toHaveLength(0);
  });

  it('reports warning for select field with no options', () => {
    const objects: ObjectConfig[] = [
      makeObject('task', {
        status: { type: 'select' },
      }),
    ];
    const diag = validateObjects(objects);
    expect(
      diag.some(
        (d) =>
          d.field === 'status' &&
          d.severity === 'warning' &&
          d.message.includes('options'),
      ),
    ).toBe(true);
  });

  it('does NOT warn when select field has options', () => {
    const objects: ObjectConfig[] = [
      makeObject('task', {
        status: {
          type: 'select',
          options: [
            { label: 'Open', value: 'open' },
            { label: 'Closed', value: 'closed' },
          ],
        },
      }),
    ];
    const diag = validateObjects(objects);
    expect(diag).toHaveLength(0);
  });

  it('handles multiple objects and accumulates diagnostics', () => {
    const objects: ObjectConfig[] = [
      makeObject('good', { title: { type: 'text' } }),
      makeObject('bad', {} as ObjectConfig['fields']),
    ];
    const diag = validateObjects(objects);
    expect(diag.length).toBeGreaterThan(0);
    expect(diag.every((d) => d.object === 'bad')).toBe(true);
  });

  it('returns typed diagnostics', () => {
    const diag: ValidationDiagnostic[] = validateObjects([]);
    expect(Array.isArray(diag)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Module exports smoke test
// ---------------------------------------------------------------------------

describe('module exports', () => {
  it('exports InspectCommand', async () => {
    const mod = await import('../src/commands/objectql/inspect');
    expect(mod.InspectCommand).toBeDefined();
    expect(mod.InspectCommand.description).toBeTruthy();
  });

  it('exports ValidateCommand', async () => {
    const mod = await import('../src/commands/objectql/validate');
    expect(mod.ValidateCommand).toBeDefined();
    expect(mod.ValidateCommand.description).toBeTruthy();
  });

  it('exports MigrateCommand', async () => {
    const mod = await import('../src/commands/objectql/migrate');
    expect(mod.MigrateCommand).toBeDefined();
    expect(mod.MigrateCommand.description).toContain('migration');
  });

  it('exports SeedCommand', async () => {
    const mod = await import('../src/commands/objectql/seed');
    expect(mod.SeedCommand).toBeDefined();
    expect(mod.SeedCommand.description).toContain('seed');
  });

  it('exports QueryCommand', async () => {
    const mod = await import('../src/commands/objectql/query');
    expect(mod.QueryCommand).toBeDefined();
    expect(mod.QueryCommand.description).toContain('REPL');
  });

  it('exports DriverListCommand', async () => {
    const mod = await import('../src/commands/objectql/driver/list');
    expect(mod.DriverListCommand).toBeDefined();
    expect(mod.DriverListCommand.description).toContain('driver');
  });
});
