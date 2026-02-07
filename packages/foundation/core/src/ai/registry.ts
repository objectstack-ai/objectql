/**
 * ObjectQL - AI Runtime Registry
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  AiRegistry,
  AiModelDefinition,
  ModelRegistry,
  PromptRegistry,
  PromptTemplate,
} from '@objectql/types';

const DEFAULT_PROMPT_VERSION = 'latest';

export class InMemoryModelRegistry implements ModelRegistry {
  private readonly models = new Map<string, AiModelDefinition>();

  register(model: AiModelDefinition): void {
    this.models.set(model.id, model);
  }

  get(id: string): AiModelDefinition | undefined {
    return this.models.get(id);
  }

  list(): readonly AiModelDefinition[] {
    return Array.from(this.models.values());
  }

  remove(id: string): void {
    this.models.delete(id);
  }
}

export class InMemoryPromptRegistry implements PromptRegistry {
  private readonly prompts = new Map<string, Map<string, PromptTemplate>>();

  register(template: PromptTemplate): void {
    const version = template.version ?? DEFAULT_PROMPT_VERSION;
    const byId = this.prompts.get(template.id) ?? new Map<string, PromptTemplate>();
    byId.set(version, { ...template, version });
    this.prompts.set(template.id, byId);
  }

  get(id: string, version?: string): PromptTemplate | undefined {
    const byId = this.prompts.get(id);
    if (!byId) return undefined;
    if (version) return byId.get(version);
    if (byId.has(DEFAULT_PROMPT_VERSION)) return byId.get(DEFAULT_PROMPT_VERSION);
    return byId.values().next().value;
  }

  list(id?: string): readonly PromptTemplate[] {
    if (id) {
      return Array.from(this.prompts.get(id)?.values() ?? []);
    }
    return Array.from(this.prompts.values()).flatMap(map => Array.from(map.values()));
  }

  remove(id: string, version?: string): void {
    if (!version) {
      this.prompts.delete(id);
      return;
    }
    const byId = this.prompts.get(id);
    if (!byId) return;
    byId.delete(version);
    if (byId.size === 0) {
      this.prompts.delete(id);
    }
  }
}

export const createDefaultAiRegistry = (): AiRegistry => ({
  models: new InMemoryModelRegistry(),
  prompts: new InMemoryPromptRegistry(),
});
