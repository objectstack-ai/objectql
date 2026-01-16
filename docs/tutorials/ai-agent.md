# Building an Autonomous Data Agent

> **Prerequisites**: [Task Manager Tutorial](./task-manager.md).
> **Concepts**: ObjectQL as a "Tool" for LLMs.

In this tutorial, we will build an AI Agent that can answer questions about your data by autonomously querying the ObjectQL database. We will use OpenAI's "Function Calling" capability.

## 1. The Scenario: Inventory Management

We have a warehouse. Users want to ask: *"How many Laptops do we have in Stock?"* or *"Reduce the stock of iPad by 5".*

Create `product.object.yml`:
```yaml
name: product
fields:
  name: 
    type: text
    required: true
    searchable: true
  sku:
    type: text
    required: true
    unique: true
  stock_quantity:
    type: number
    default: 0
  price:
    type: currency
```

## 2. Defining the Tools (The Magic Step)

Because ObjectQL is metadata-driven, we can automatically generate OpenAI Tool Definitions from our schema.

*In a real app, you would generate this dynamically. Here we write it manually for clarity.*

```typescript
const productTools = [
  {
    type: "function",
    function: {
      name: "find_products",
      description: "Search for products and check stock levels",
      parameters: {
        type: "object",
        properties: {
          filters: {
            type: "array",
            description: "ObjectQL filters, e.g. [['name', 'contains', 'ipad']]"
          }
        },
        required: ["filters"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_stock",
      description: "Update the stock quantity for a product",
      parameters: {
        type: "object",
        properties: {
          sku: { type: "string" },
          quantity_change: { type: "number", description: "Negative to reduce stock" }
        },
        required: ["sku", "quantity_change"]
      }
    }
  }
];
```

## 3. The Agent Loop

Create `agent.ts`. You'll need `openai` installed (`npm install openai`).

```typescript
import OpenAI from "openai";
import { ObjectQL } from '@objectql/core';
import { SqliteDriver } from '@objectql/driver-sql';

// 1. Setup ObjectQL
const app = new ObjectQL({
    driver: new SqliteDriver({ database: 'inventory.db' })
});
await app.init();

// 2. Setup OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function runAgent(userQuery: string) {
    console.log(`User: ${userQuery}`);
    
    // Step 1: LLM decides what to do
    const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: userQuery }],
        tools: productTools,
    });

    const toolCall = completion.choices[0].message.tool_calls?.[0];
    
    if (toolCall) {
        // Step 2: Execute the tool (ObjectQL)
        const fnName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        let result;

        console.log(`🤖 Invoking tool: ${fnName}`, args);

        if (fnName === 'find_products') {
            // DIRECT MAPPING: Tool Args -> ObjectQL Query
            result = await app.object('product').find({ filters: args.filters });
        } 
        else if (fnName === 'update_stock') {
            // Find ID first (Business Logic)
            const product = await app.object('product').findOne({ sku: args.sku });
            if (product) {
                const newStock = product.stock_quantity + args.quantity_change;
                await app.object('product').update(product._id, { stock_quantity: newStock });
                result = { success: true, new_stock: newStock };
            } else {
                result = { error: "Product not found" };
            }
        }

        // Step 3: Feed result back to LLM
        const finalResponse = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "user", content: userQuery },
                { role: "assistant", tool_calls: [toolCall] },
                { role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(result) }
            ]
        });

        console.log(`Agent: ${finalResponse.choices[0].message.content}`);
    }
}

// Try it!
// runAgent("Do we have any iPad Pro in stock?");
// runAgent("We just sold 2 iPad Pros, please update inventory.");
```

## 4. Why this is powerful

Notice that the LLM is **writing ObjectQL filters** directly (`[['name', 'contains', 'ipad']]`).

*   **No SQL Generation**: The LLM doesn't need to know table names or join syntax.
*   **Safety**: The LLM cannot execute arbitrary SQL. It is confined to the `find()` API.
*   **Determinism**: The `filters` array is a strict JSON structure, easy to parse and validate.

This is why ObjectQL is "AI-Native"—it speaks JSON, the same language as the Agents.
