/**
 * Example: Connect to an Existing Database Without Metadata
 * 
 * This example demonstrates how to use ObjectQL with an existing database
 * without defining any metadata files. The system will automatically discover
 * tables, columns, and relationships.
 */

import { ObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

async function main() {
    // Step 1: Create a driver pointing to your existing database
    const driver = new SqlDriver({
        client: 'postgresql', // or 'mysql', 'mysql2', 'sqlite3'
        connection: {
            host: 'localhost',
            port: 5432,
            user: 'your_username',
            password: 'your_password',
            database: 'your_existing_database'
        }
    });

    // Step 2: Initialize ObjectQL with the driver
    const app = new ObjectQL({
        datasources: {
            default: driver
        }
    });

    // Step 3: Introspect the database and automatically register objects
    console.log('Introspecting database schema...');
    const objects = await app.introspectAndRegister('default', {
        // Optional: Only include specific tables
        // includeTables: ['users', 'orders', 'products'],
        
        // Optional: Exclude certain tables
        excludeTables: ['migrations', 'sessions'],
        
        // Optional: Skip system columns (id, created_at, updated_at) - default is true
        skipSystemColumns: true
    });

    console.log(`Discovered ${objects.length} tables:`);
    objects.forEach(obj => {
        console.log(`- ${obj.name}: ${Object.keys(obj.fields).length} fields`);
    });

    // Step 4: Initialize the app (will NOT modify existing tables)
    await app.init();

    // Step 5: Use the discovered objects!
    const ctx = app.createContext({ isSystem: true });

    // Example: Query users table
    const users = await ctx.object('users').find({
        filters: [['active', '=', true]],
        limit: 10
    });
    console.log(`Found ${users.length} active users`);

    // Example: Create a new record
    const newUser = await ctx.object('users').create({
        name: 'John Doe',
        email: 'john@example.com',
        active: true
    });
    console.log('Created user:', newUser);

    // Example: Update a record
    await ctx.object('users').update(newUser.id, {
        last_login: new Date()
    });

    // Example: Query with joins (if you have foreign keys)
    const orders = await ctx.object('orders').find({
        filters: [['customer_id', '=', newUser.id]]
    });
    console.log(`User has ${orders.length} orders`);

    // Cleanup
    await driver.disconnect();
}

// Run the example
main().catch(console.error);
