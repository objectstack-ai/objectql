/**
 * ObjectQL - AI Registry Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createDefaultAiRegistry } from '../src/ai';

describe('AI Registry', () => {
  it('registers and retrieves models', () => {
    const registry = createDefaultAiRegistry();

    registry.models.register({
      id: 'embed-small',
      provider: 'openai',
      model: 'text-embedding-3-small',
      type: 'embedding',
      embeddingDimensions: 1536,
    });

    const model = registry.models.get('embed-small');
    expect(model?.model).toBe('text-embedding-3-small');
    expect(registry.models.list().length).toBe(1);
  });

  it('registers and retrieves prompt templates', () => {
    const registry = createDefaultAiRegistry();

    registry.prompts.register({
      id: 'greeting',
      template: 'Hello, {{name}}!',
      variables: ['name'],
      version: 'v1',
    });

    const prompt = registry.prompts.get('greeting', 'v1');
    expect(prompt?.template).toBe('Hello, {{name}}!');
    expect(registry.prompts.list('greeting').length).toBe(1);
  });
});
