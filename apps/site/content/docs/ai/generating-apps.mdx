# Generating Apps with AI

Because ObjectQL applications are defined primarily by **Metadata** (YAML/JSON) rather than **Code** (Classes/Functions), LLMs can generate complete, working backends in a single pass.

This is "Zero-Shot Microservice Generation".

## The Workflow

1.  **Prompt**: You ask the AI to design a system (e.g., "A Property Management System").
2.  **Generation**: The AI outputs a set of `*.object.yml` files.
3.  **Execution**: You drop these files into your project, and the API is instantly live.

## Prompting Guide

To get the best results, use a prompt that enforces the ObjectQL schema format.

### Template

> **Act as an ObjectQL Architect.**
>
> I need a backend for **[APP_DESCRIPTION]**.
>
> Please generate the object definitions in YAML format.
> Follow these rules:
> 1. Use standard types: `text`, `number`, `boolean`, `select`, `date`, `lookup`.
> 2. For relationships, use `type: lookup` with `reference_to: <object_name>`.
> 3. Include `required: true` for important fields.
> 4. Suggest 2-3 essential objects.
>
> Output the YAML for each object in a separate code block.

### Example: Real Estate CRM

**User:**
> "I need a backend for a Real Estate Agency to track Properties and Agents."

**AI Output:**

```yaml
# agent.object.yml
name: agent
fields:
  name:
    type: text
    required: true
  email:
    type: email
    required: true
  phone:
    type: phone
  license_number:
    type: text
  status:
    type: select
    options: [active, inactive]
```

```yaml
# property.object.yml
name: property
fields:
  address:
    type: textarea
    required: true
  price:
    type: currency
  bedrooms:
    type: number
  bathrooms:
    type: number
  listing_agent:
    type: lookup
    reference_to: agent
  status:
    type: select
    options: [for_sale, sold, pending]
```

## Automating the Process

You can build tools to automate this loop.

### 1. The Generator Script
Imagine a simple CLI tool that takes a user description and writes files to disk.

```typescript
import { generateSchema } from './my-llm-service'; // Wrapper around OpenAI

async function main() {
    const description = process.argv[2];
    const schemas = await generateSchema(description);
    
    for (const schema of schemas) {
        fs.writeFileSync(`${schema.name}.object.yml`, yaml.dump(schema));
    }
    
    console.log("App generated! Starting server...");
}
```

### 2. Hot Reloading
Since ObjectQL can load metadata at runtime, you can build **Self-Evolving Apps**.
1.  The App receives a request: "Add a 'renovation_date' field to Property."
2.  The App calls an LLM to update the YAML.
3.  The App reloads the metadata registry.
4.  The new field is immediately available via API.

## Summary

ObjectQL turns software development into a **Content Generation** task. 
Instead of generating complex imperative code (which is brittle), you generate simple declarative configurations (which are robust).
