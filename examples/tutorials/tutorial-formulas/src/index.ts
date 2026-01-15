/**
 * Formula Engine Tutorial
 * 
 * This tutorial demonstrates the formula engine capabilities in ObjectQL.
 * Run with: npm run dev
 */

import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

async function main() {
  console.log('🚀 ObjectQL Formula Engine Tutorial\n');

  // Initialize ObjectQL with in-memory SQLite
  const driver = new SqlDriver({
    client: 'sqlite3',
    connection: { filename: ':memory:' },
    useNullAsDefault: true,
  });

  const app = new ObjectQL({
    datasources: { default: driver },
  });

  // E-COMMERCE ORDER EXAMPLE
  console.log('📦 Example 1: E-commerce Order with Price Calculations\n');

  app.registerObject({
    name: 'order',
    fields: {
      product_name: { type: 'text', required: true },
      quantity: { type: 'number', required: true },
      unit_price: { type: 'currency', required: true },
      discount_rate: { type: 'percent', defaultValue: 0 },
      tax_rate: { type: 'percent', defaultValue: 8 },
      
      // Formula fields
      subtotal: {
        type: 'formula',
        formula: 'quantity * unit_price',
        data_type: 'currency',
        label: 'Subtotal',
      },
      final_price: {
        type: 'formula',
        formula: 'quantity * unit_price * (1 - discount_rate / 100) * (1 + tax_rate / 100)',
        data_type: 'currency',
        label: 'Final Price',
      },
      discount_amount: {
        type: 'formula',
        formula: 'quantity * unit_price * (discount_rate / 100)',
        data_type: 'currency',
        label: 'You Save',
      },
    },
  });

  await app.init();

  const ctx = app.createContext({ isSystem: true });

  // Create sample order
  const order = await ctx.object('order').create({
    product_name: 'Premium Laptop',
    quantity: 2,
    unit_price: 1299.99,
    discount_rate: 15,
    tax_rate: 8,
  });

  console.log('📦 Order Created:');
  console.log('  Subtotal: $' + order.subtotal?.toFixed(2));
  console.log('  You Save: $' + order.discount_amount?.toFixed(2));
  console.log('  Final Price: $' + order.final_price?.toFixed(2));

  console.log('\n✅ Tutorial complete!\n');

  await app.close();
}

main().catch(console.error);
