/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQL } from '@objectstack/objectql';
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
  
  // 3. Define Metadata Inline (Following Latest ObjectStack Specification)
  // Note: When using registerObject(), the 'name' is required in code
  // When using YAML files, the name is inferred from filename (e.g., deal.object.yml)
  app.registerObject({
    name: 'deal',  // Required for programmatic registration
    label: 'Deal',  // Human-readable label
    fields: {
      title: { 
        type: 'text', 
        required: true,
        label: 'Deal Title'
      },
      amount: { 
        type: 'currency',
        label: 'Deal Amount'
      },
      stage: { 
        type: 'select',
        label: 'Deal Stage',
        // Options use label/value format (ObjectStack spec v4.0+)
        options: [
            { label: 'New', value: 'new' },
            { label: 'Negotiation', value: 'negotiation' },
            { label: 'Closed', value: 'closed' }
        ],
        defaultValue: 'new'
      }
    }
  });

  await app.init(); // Boot the engine

  // 4. Run Business Logic
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

if (require.main === module) {
    main().catch(console.error);
}
