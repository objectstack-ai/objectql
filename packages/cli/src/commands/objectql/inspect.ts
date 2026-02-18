/**
 * @objectstack/plugin-objectql
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command, Flags } from '@oclif/core';
import { MetadataRegistry, ObjectConfig, FieldConfig } from '@objectql/types';

/**
 * Inspect command — lists registered Objects, fields, and relations
 * from a MetadataRegistry.
 *
 * Usage:
 *   os objectql inspect
 *   os objectql inspect --object account
 *   os objectql inspect --json
 */
export class InspectCommand extends Command {
  static override description = 'List all registered Object schemas, fields, and relations in the current ObjectQL configuration';

  static override examples = [
    '<%= config.bin %> objectql inspect',
    '<%= config.bin %> objectql inspect --object account',
    '<%= config.bin %> objectql inspect --json',
  ];

  static override flags = {
    object: Flags.string({
      char: 'o',
      description: 'Filter to a specific object by name',
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(InspectCommand);

    const registry = await this.loadRegistry();
    const objects = registry.list<ObjectConfig>('object');

    if (objects.length === 0) {
      this.log('No objects registered in the current configuration.');
      return;
    }

    const filtered = flags.object
      ? objects.filter((o) => o.name === flags.object)
      : objects;

    if (filtered.length === 0) {
      this.log(`Object "${flags.object}" not found.`);
      return;
    }

    if (flags.json) {
      this.log(JSON.stringify(buildInspectResult(filtered), null, 2));
      return;
    }

    for (const obj of filtered) {
      this.log(`\n📦 ${obj.name}${obj.label ? ` (${obj.label})` : ''}`);
      if (obj.description) this.log(`   ${obj.description}`);
      if (obj.datasource) this.log(`   datasource: ${obj.datasource}`);

      const fields = obj.fields ?? {};
      const fieldEntries = Object.entries(fields);
      if (fieldEntries.length > 0) {
        this.log('   Fields:');
        for (const [fname, fconfig] of fieldEntries) {
          const fc = fconfig as FieldConfig;
          const parts = [`     - ${fname}: ${fc.type}`];
          if (fc.required) parts.push('[required]');
          if (fc.reference_to) parts.push(`-> ${fc.reference_to}`);
          this.log(parts.join(' '));
        }
      }

      const relations = fieldEntries.filter(([, f]) => {
        const fc = f as FieldConfig;
        return fc.type === 'lookup' || fc.type === 'master_detail';
      });
      if (relations.length > 0) {
        this.log('   Relations:');
        for (const [rname, rconfig] of relations) {
          const rc = rconfig as FieldConfig;
          this.log(`     - ${rname} (${rc.type}) -> ${rc.reference_to}`);
        }
      }
    }

    this.log(`\nTotal: ${filtered.length} object(s)`);
  }

  /**
   * Load the MetadataRegistry. In a real integration the registry is provided
   * by the ObjectStack kernel context. For standalone usage we instantiate a
   * default empty one (the host CLI injects the real one).
   */
  private async loadRegistry(): Promise<MetadataRegistry> {
    // The host CLI (@objectstack/cli) populates this via the oclif plugin
    // context. When running standalone we return an empty registry.
    return (this.config.pjson as Record<string, unknown>).__registry as MetadataRegistry
      ?? new MetadataRegistry();
  }
}

/** Build a structured inspection result for JSON output. */
function buildInspectResult(objects: ObjectConfig[]): InspectResult[] {
  return objects.map((obj) => {
    const fields = Object.entries(obj.fields ?? {}).map(([name, f]) => {
      const fc = f as FieldConfig;
      return {
        name,
        type: fc.type,
        required: fc.required ?? false,
        reference_to: fc.reference_to,
      };
    });

    const relations = fields.filter(
      (f) => f.type === 'lookup' || f.type === 'master_detail',
    );

    return {
      name: obj.name,
      label: obj.label,
      description: obj.description,
      datasource: obj.datasource,
      fieldCount: fields.length,
      fields,
      relations,
    };
  });
}

interface InspectResult {
  name: string;
  label?: string;
  description?: string;
  datasource?: string;
  fieldCount: number;
  fields: { name: string; type: string; required: boolean; reference_to?: string }[];
  relations: { name: string; type: string; required: boolean; reference_to?: string }[];
}
