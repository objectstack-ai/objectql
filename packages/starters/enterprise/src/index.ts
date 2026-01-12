/**
 * Enterprise Structure Example - Main Entry Point
 * 
 * This demonstrates how to organize metadata for large-scale ObjectQL applications
 * using a modular, domain-driven structure.
 */

import { ObjectQL } from '@objectql/core';
import { KnexDriver } from '@objectql/driver-sql';
import { ObjectLoader } from '@objectql/platform-node';
import path from 'path';

/**
 * Initialize ObjectQL with enterprise structure
 */
export async function initializeApp() {
  const app = new ObjectQL({
    datasources: {
      default: new KnexDriver({
        client: 'sqlite3',
        connection: {
          filename: ':memory:'
        }
      })
    }
  });

  // Load metadata from current directory
  const loader = new ObjectLoader(app.metadata);
  loader.load(__dirname);

  await app.init();
  return app;
}

if (require.main === module) {
  initializeApp().then(async (app) => {
    console.log('Enterprise structure example started!');
    console.log('Loaded objects:', Object.keys(app.getConfigs()).length);
  }).catch(console.error);
}
