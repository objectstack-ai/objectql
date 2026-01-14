/**
 * Simple Node.js example using @objectql/sdk
 * 
 * This demonstrates how to use the ObjectQL SDK in a Node.js environment.
 * The same code works in browsers, Deno, and edge runtimes!
 */

import { DataApiClient, MetadataApiClient } from '@objectql/sdk';

// Initialize clients
const dataClient = new DataApiClient({
    baseUrl: process.env.OBJECTQL_URL || 'http://localhost:3000',
    token: process.env.OBJECTQL_TOKEN // Optional authentication
});

const metadataClient = new MetadataApiClient({
    baseUrl: process.env.OBJECTQL_URL || 'http://localhost:3000'
});

async function main() {
    try {
        console.log('🚀 ObjectQL SDK Node.js Example\n');

        // 1. List all available objects
        console.log('📚 Listing all objects...');
        const objectsResponse = await metadataClient.listObjects();
        console.log(`Found ${objectsResponse.items?.length || 0} objects:\n`);
        objectsResponse.items?.forEach(obj => {
            console.log(`  - ${obj.name} (${obj.label})`);
        });

        // 2. Get schema for a specific object (e.g., 'users')
        console.log('\n🔍 Getting schema for "users" object...');
        const userSchema = await metadataClient.getObject('users');
        console.log(`\nObject: ${userSchema.label}`);
        console.log('Fields:');
        Object.entries(userSchema.fields).forEach(([key, field]) => {
            console.log(`  - ${field.name} (${field.type})${field.required ? ' *required' : ''}`);
        });

        // 3. List users with filtering
        console.log('\n📋 Listing active users...');
        const usersResponse = await dataClient.list('users', {
            filter: [['status', '=', 'active']],
            sort: [['created_at', 'desc']],
            limit: 5
        });
        console.log(`Found ${usersResponse.items?.length || 0} active users`);
        usersResponse.items?.forEach(user => {
            console.log(`  - ${user.name} (${user.email})`);
        });

        // 4. Count total users
        console.log('\n🔢 Counting all users...');
        const countResponse = await dataClient.count('users');
        console.log(`Total users: ${countResponse.count}`);

        // 5. Create a new user (example - commented out to avoid side effects)
        /*
        console.log('\n➕ Creating a new user...');
        const newUser = await dataClient.create('users', {
            name: 'SDK Example User',
            email: `sdk-example-${Date.now()}@example.com`,
            status: 'active'
        });
        console.log(`Created user: ${newUser.name} (ID: ${newUser._id})`);
        */

        console.log('\n✅ Example completed successfully!');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        
        if (error.code) {
            console.error('Error code:', error.code);
        }
        
        if (error.details) {
            console.error('Details:', error.details);
        }

        process.exit(1);
    }
}

// Run the example
main();
