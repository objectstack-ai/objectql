/**
 * ObjectQL - AI Namespace Types
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * RUNTIME EXTENSIONS: Not part of the wire protocol.
 * These types define stable integration points for AI features.
 */

/** AI model task types */
export type AiModelType = 'chat' | 'embedding' | 'rerank' | 'completion' | 'tool';

/** Model capability flags */
export interface AiModelCapabilities {
  readonly chat?: boolean;
  readonly embedding?: boolean;
  readonly rerank?: boolean;
  readonly toolCalling?: boolean;
  readonly vision?: boolean;
}

/** AI model definition for registry */
export interface AiModelDefinition {
  /** Unique identifier for registry lookup */
  readonly id: string;
  /** Provider name (e.g., openai, anthropic, local) */
  readonly provider: string;
  /** Provider model name */
  readonly model: string;
  /** Task type */
  readonly type: AiModelType;
  /** Optional display name */
  readonly displayName?: string;
  /** Max output tokens for generation */
  readonly maxTokens?: number;
  /** Context window size */
  readonly contextWindow?: number;
  /** Embedding dimensions (if embedding model) */
  readonly embeddingDimensions?: number;
  /** Capability flags */
  readonly capabilities?: AiModelCapabilities;
  /** Arbitrary metadata */
  readonly metadata?: Record<string, unknown>;
}

/** Registry for AI models */
export interface ModelRegistry {
  register(model: AiModelDefinition): void;
  get(id: string): AiModelDefinition | undefined;
  list(): readonly AiModelDefinition[];
  remove(id: string): void;
}

/** Prompt template definition */
export interface PromptTemplate {
  /** Stable prompt identifier */
  readonly id: string;
  /** Optional semantic version tag */
  readonly version?: string;
  /** Optional display name */
  readonly name?: string;
  /** Prompt template string */
  readonly template: string;
  /** Declared variables for the template */
  readonly variables?: readonly string[];
  /** Optional description */
  readonly description?: string;
  /** Arbitrary metadata */
  readonly metadata?: Record<string, unknown>;
}

/** Registry for prompt templates */
export interface PromptRegistry {
  register(template: PromptTemplate): void;
  get(id: string, version?: string): PromptTemplate | undefined;
  list(id?: string): readonly PromptTemplate[];
  remove(id: string, version?: string): void;
}

/** Document for RAG indexing */
export interface RagDocument {
  readonly id: string;
  readonly content: string;
  readonly metadata?: Record<string, unknown>;
}

/** RAG search options */
export interface RagSearchOptions {
  readonly topK?: number;
  readonly filter?: Record<string, unknown>;
  readonly minScore?: number;
  readonly namespace?: string;
}

/** RAG search result */
export interface RagSearchResult {
  readonly document: RagDocument;
  readonly score: number;
}

/** Embedding provider interface */
export interface EmbeddingProvider {
  embed(texts: readonly string[], modelId: string, options?: { readonly dimensions?: number }): Promise<number[][]>;
}

/** Vector store interface for RAG */
export interface VectorStore {
  upsert(
    documents: readonly RagDocument[],
    embeddings?: number[][],
    options?: { readonly namespace?: string },
  ): Promise<void>;
  query(embedding: number[], options?: RagSearchOptions): Promise<RagSearchResult[]>;
  delete(ids: readonly string[], options?: { readonly namespace?: string }): Promise<void>;
  clear(options?: { readonly namespace?: string }): Promise<void>;
}

/** AI registry surface for runtime */
export interface AiRegistry {
  readonly models: ModelRegistry;
  readonly prompts: PromptRegistry;
  readonly embeddings?: EmbeddingProvider;
  readonly vectorStore?: VectorStore;
}
