import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

async function main() {
  console.log("🚀 Starting ObjectQL Hello World...");

  // 1. Initialize Driver
  const driver = new SqlDriver({
    client: 'sqlite3',
    connection: { filename: ':memory:' }, 
    useNullAsDefault: true
  });

  // 2. Initialize Engine (Pass driver in config)
  const app = new ObjectQL({
    datasources: {
        default: driver
    }
  });
  
  // 3. Define Metadata Inline
  app.registerObject({
    name: 'deal',
    fields: {
      title: { type: 'text', required: true },
      amount: { type: 'currency', scale: 2 },
      stage: { 
        type: 'select', 
        options: ['new', 'negotiation', 'closed'],
        defaultValue: 'new'
      }
    }
  });

  await app.init(); // Boot the engine

  // 4. Run Business Logic
  // We create a system context to bypass permission checks for this simple script
  const ctx = app.createContext({ isSystem: true });
  const repo = ctx.object('deal');
  
  console.log("Creating a new Deal...");
  await repo.create({ 
    title: 'Enterprise Contract', 
    amount: 50000, 
    stage: 'new' 
  });
  
  const results = await repo.find({});
  console.log('✅ Deals found in database:', results); 
}

main().catch(console.error);
