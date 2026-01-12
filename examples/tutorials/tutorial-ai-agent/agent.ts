import OpenAI from "openai";
import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';
import dotenv from 'dotenv';

dotenv.config();

// Tool Definitions
const productTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "find_products",
      description: "Search for products and check stock levels. Returns list of products matching the filter.",
      parameters: {
        type: "object",
        properties: {
          filters: {
            type: "array",
            description: "ObjectQL filters, e.g. [['name', 'contains', 'ipad']]",
            items: {
                type: "array"
            }
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
          quantity_change: { type: "number", description: "Negative to reduce stock, positive to add" }
        },
        required: ["sku", "quantity_change"]
      }
    }
  }
];

async function runAgent() {
    // 1. Setup ObjectQL
    const app = new ObjectQL({
        driver: new SqlDriver({
            client: 'sqlite3',
            connection: { filename: './inventory.db' },
            useNullAsDefault: true
        })
    });
    await app.init(); // Load metadata
    
    // Seed some data if empty
    try {
        const existing = await app.find('product', {});
        if (existing.length === 0) {
            console.log("Seeding initial data...");
            await app.create('product', { name: "MacBook Pro 16", sku: "MBP16", stock_quantity: 10, price: 2499 });
            await app.create('product', { name: "iPad Air", sku: "IPAD-AIR", stock_quantity: 50, price: 599 });
        }
    } catch (e) {
        console.warn("Database init error:", e);
    }

    if (!process.env.OPENAI_API_KEY) {
        console.error("Please set OPENAI_API_KEY in .env");
        return;
    }

    // 2. Setup OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const userQuery = process.argv[2] || "How many iPad Airs do we have?";
    console.log(`\nUser: "${userQuery}"`);
    
    // Step 1: LLM decides what to do
    const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: userQuery }],
        tools: productTools,
    });

    const choice = completion.choices[0];
    const toolCall = choice.message.tool_calls?.[0];

    if (toolCall) {
        console.log(`\nAgent decided to call tool: ${toolCall.function.name}`);
        const args = JSON.parse(toolCall.function.arguments);
        console.log(`Arguments:`, args);

        let result;
        if (toolCall.function.name === 'find_products') {
            result = await app.find('product', args.filters || []);
        } else if (toolCall.function.name === 'update_stock') {
            const products = await app.find('product', [['sku', '=', args.sku]]);
            if (products.length > 0) {
                const product = products[0];
                const newQty = (product.stock_quantity || 0) + args.quantity_change;
                result = await app.update('product', product.id, { stock_quantity: newQty });
            } else {
                result = { error: "Product not found" };
            }
        }

        console.log(`\nTool Output:`, JSON.stringify(result, null, 2));

        // Step 2: Feed back to LLM (Optional simplification for tutorial)
        const finalResponse = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "user", content: userQuery },
                choice.message,
                {
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                }
            ]
        });

        console.log(`\nAgent Final Answer: ${finalResponse.choices[0].message.content}`);
    } else {
        console.log(`\nAgent Answer: ${choice.message.content}`);
    }
}

runAgent();
