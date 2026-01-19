# Building AI-Native Apps

ObjectQL is engineered to be the ideal data layer for AI Agents and LLMs. By providing a **Structure-First** protocol (JSON AST) instead of raw strings (SQL), it drastically reduces hallucinations and injection risks.

## 1. Why ObjectQL for AI?

| Feature | SQL / Traditional ORM | ObjectQL |
| :--- | :--- | :--- |
| **Output** | Unstructured String | **Strict JSON** |
| **Safety** | Injection Vulnerable | **Injection Safe** |
| **Context** | Heavy DDL dumps | **Lightweight Scoped Schema** |

LLMs excel at generating JSON. ObjectQL lets the LLM speak its native language.

## 2. Semantic Search (RAG)

ObjectQL has first-class support for Vector Search. You don't need a separate vector database (like Pinecone) or generic ORM hacks.

### Configuration

Enable search in your `*.object.yml`.

```yaml
# knowledge.object.yml
name: knowledge
fields:
  title: { type: text }
  content: { type: textarea }

# Enable AI capabilities
ai:
  search:
    enabled: true
    fields: [title, content] # Fields to embed
    model: text-embedding-3-small
```

### Usage

When enabled, the driver manages the embeddings automatically. You can then search using natural language.

```typescript
// Search for "How to reset password"
const results = await objectql.search('knowledge', 'How to reset password');

// returns: [{ id: 1, title: 'Reset Config', _score: 0.89 }, ...]
```

## 3. Explicit Vector Columns

For advanced use cases (e.g., Image Search or Multi-modal embeddings), you can define raw vector columns.

```yaml
fields:
  image_url:
    type: url
  
  clip_embedding:
    type: vector
    dimension: 512
    index: true # Create IVFFlat/HNSW index
```

## 4. LLM to Query (Text-to-SQL alternative)

Instead of asking an LLM to write SQL, ask it to write ObjectQL JSON.

**Prompt Pattern:**

```text
You are a data assistant.
Schema:
- Object: Task (fields: title, status, priority)

User: "Find my high priority tasks"

Output JSON in ObjectQL format:
{
  "entity": "task",
  "filters": [["priority", "=", "High"]]
}
```

This output can be safely executed by the ObjectQL engine without fear of `DROP TABLE` injections.
