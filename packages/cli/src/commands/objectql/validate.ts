/**
 * @objectstack/plugin-objectql
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command, Flags } from '@oclif/core';
import { ObjectConfig, FieldConfig } from '@objectql/types';

/** A single validation diagnostic. */
export interface ValidationDiagnostic {
  object: string;
  field?: string;
  severity: 'error' | 'warning';
  message: string;
}

/**
 * Validate command — statically validates ObjectQL schema configuration.
 *
 * Checks performed:
 * - Every object has a `name` and at least one field
 * - Every field has a `type`
 * - Lookup / master_detail fields have `reference_to` or `reference`
 * - Select fields have `options` defined
 * - No duplicate field names within an object
 *
 * Usage:
 *   os objectql validate
 *   os objectql validate --json
 */
export class ValidateCommand extends Command {
  static override description = 'Validate ObjectQL schema configuration for correctness';

  static override examples = [
    '<%= config.bin %> objectql validate',
    '<%= config.bin %> objectql validate --json',
  ];

  static override flags = {
    json: Flags.boolean({
      description: 'Output diagnostics in JSON format',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ValidateCommand);

    const objects = await this.loadObjects();
    const diagnostics = validateObjects(objects);

    if (flags.json) {
      this.log(JSON.stringify({ valid: diagnostics.length === 0, diagnostics }, null, 2));
      return;
    }

    if (diagnostics.length === 0) {
      this.log('✅ All objects are valid.');
      return;
    }

    const errors = diagnostics.filter((d) => d.severity === 'error');
    const warnings = diagnostics.filter((d) => d.severity === 'warning');

    for (const d of diagnostics) {
      const icon = d.severity === 'error' ? '❌' : '⚠️';
      const location = d.field ? `${d.object}.${d.field}` : d.object;
      this.log(`${icon}  ${location}: ${d.message}`);
    }

    this.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
    if (errors.length > 0) {
      this.exit(1);
    }
  }

  /**
   * Load object configs. The host CLI provides objects via the oclif plugin
   * context. For standalone mode we return an empty array.
   */
  private async loadObjects(): Promise<ObjectConfig[]> {
    const pjson = this.config.pjson as Record<string, unknown>;
    return (pjson.__objects as ObjectConfig[]) ?? [];
  }
}

/**
 * Pure validation logic — can be unit-tested without oclif.
 */
export function validateObjects(objects: ObjectConfig[]): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = [];

  for (const obj of objects) {
    // Object-level checks
    if (!obj.name) {
      diagnostics.push({
        object: '<unnamed>',
        severity: 'error',
        message: 'Object is missing a "name" property.',
      });
      continue;
    }

    const fieldEntries = Object.entries(obj.fields ?? {});
    if (fieldEntries.length === 0) {
      diagnostics.push({
        object: obj.name,
        severity: 'error',
        message: 'Object has no fields defined.',
      });
    }

    // Field-level checks
    const seenFields = new Set<string>();
    for (const [fname, fconfig] of fieldEntries) {
      const fc = fconfig as FieldConfig;

      if (seenFields.has(fname)) {
        diagnostics.push({
          object: obj.name,
          field: fname,
          severity: 'error',
          message: `Duplicate field name "${fname}".`,
        });
      }
      seenFields.add(fname);

      if (!fc.type) {
        diagnostics.push({
          object: obj.name,
          field: fname,
          severity: 'error',
          message: 'Field is missing a "type" property.',
        });
      }

      if (
        (fc.type === 'lookup' || fc.type === 'master_detail') &&
        !fc.reference_to &&
        !fc.reference
      ) {
        diagnostics.push({
          object: obj.name,
          field: fname,
          severity: 'error',
          message: `Relational field "${fname}" is missing "reference_to" or "reference".`,
        });
      }

      if (fc.type === 'select' && (!fc.options || fc.options.length === 0)) {
        diagnostics.push({
          object: obj.name,
          field: fname,
          severity: 'warning',
          message: 'Select field has no options defined.',
        });
      }
    }
  }

  return diagnostics;
}
