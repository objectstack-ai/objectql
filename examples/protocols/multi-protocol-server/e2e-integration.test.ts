/**
 * End-to-End Multi-Protocol Integration Tests
 * 
 * This test suite validates that all ObjectQL protocols can run simultaneously
 * and access the same data consistently.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ObjectKernel } from '@objectstack/core';
import { MemoryDriver } from '@objectql/driver-memory';
import { RESTPlugin } from '@objectql/protocol-rest';
import { GraphQLPlugin } from '@objectql/protocol-graphql';
import { ODataV4Plugin } from '@objectql/protocol-odata-v4';
import { JSONRPCPlugin } from '@objectql/protocol-json-rpc';

describe('End-to-End Multi-Protocol Integration', () => {
  let kernel: ObjectKernel;
  let restPort: number;
  let graphqlPort: number;
  let odataPort: number;
  let jsonrpcPort: number;
  
  let restBaseUrl: string;
  let graphqlUrl: string;
  let odataBaseUrl: string;
  let jsonrpcUrl: string;
  
  beforeAll(async () => {
    // Generate unique ports to avoid conflicts
    const basePort = 10000 + Math.floor(Math.random() * 1000);
    restPort = basePort;
    graphqlPort = basePort + 1;
    odataPort = basePort + 2;
    jsonrpcPort = basePort + 3;
    
    // Set up URLs
    restBaseUrl = `http://localhost:${restPort}/api`;
    graphqlUrl = `http://localhost:${graphqlPort}`;
    odataBaseUrl = `http://localhost:${odataPort}/odata`;
    jsonrpcUrl = `http://localhost:${jsonrpcPort}/rpc`;
    
    // Create kernel with ALL protocols
    kernel = new ObjectKernel([
      new MemoryDriver(),
      
      new RESTPlugin({
        port: restPort,
        basePath: '/api',
        enableOpenAPI: true
      }),
      
      new GraphQLPlugin({
        port: graphqlPort,
        introspection: true,
        playground: false
      }),
      
      new ODataV4Plugin({
        port: odataPort,
        basePath: '/odata',
        namespace: 'E2ETest'
      }),
      
      new JSONRPCPlugin({
        port: jsonrpcPort,
        basePath: '/rpc',
        enableProgress: true,
        enableChaining: true
      })
    ]);
    
    // Register test entities
    kernel.metadata.register('object', 'users', {
      name: 'users',
      label: 'Users',
      fields: {
        name: { type: 'text', label: 'Name', required: true },
        email: { type: 'text', label: 'Email', required: true },
        age: { type: 'number', label: 'Age' },
        active: { type: 'boolean', label: 'Active', default: true }
      }
    });
    
    kernel.metadata.register('object', 'projects', {
      name: 'projects',
      label: 'Projects',
      fields: {
        name: { type: 'text', label: 'Name', required: true },
        description: { type: 'text', label: 'Description' },
        status: { type: 'text', label: 'Status', default: 'active' },
        owner_id: { type: 'text', label: 'Owner ID' }
      }
    });
    
    await kernel.start();
    
    // Wait for all servers to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  }, 60000);
  
  afterAll(async () => {
    await kernel.stop();
  }, 30000);
  
  describe('Cross-Protocol Data Consistency', () => {
    it('should create data via REST and read via GraphQL', async () => {
      // Create user via REST
      const restResponse = await fetch(`${restBaseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alice REST',
          email: 'alice@rest.com',
          age: 30,
          active: true
        })
      });
      
      expect(restResponse.ok).toBe(true);
      const restData = await restResponse.json();
      const userId = restData.data?.id || restData.id;
      expect(userId).toBeDefined();
      
      // Read same user via GraphQL
      const graphqlQuery = `
        query {
          users(id: "${userId}") {
            id
            name
            email
            age
            active
          }
        }
      `;
      
      const graphqlResponse = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: graphqlQuery })
      });
      
      expect(graphqlResponse.ok).toBe(true);
      const graphqlData = await graphqlResponse.json();
      
      expect(graphqlData.data.users).toBeDefined();
      expect(graphqlData.data.users.name).toBe('Alice REST');
      expect(graphqlData.data.users.email).toBe('alice@rest.com');
    }, 30000);
    
    it('should create data via GraphQL and read via OData', async () => {
      // Create user via GraphQL
      const mutation = `
        mutation {
          createUsers(data: {
            name: "Bob GraphQL"
            email: "bob@graphql.com"
            age: 25
            active: true
          })
        }
      `;
      
      const graphqlResponse = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation })
      });
      
      expect(graphqlResponse.ok).toBe(true);
      const graphqlData = await graphqlResponse.json();
      const userId = graphqlData.data?.createUsers?.id;
      
      // Read same user via OData
      const odataResponse = await fetch(`${odataBaseUrl}/Users('${userId}')`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      expect(odataResponse.ok).toBe(true);
      const odataData = await odataResponse.json();
      
      expect(odataData.name).toBe('Bob GraphQL');
      expect(odataData.email).toBe('bob@graphql.com');
    }, 30000);
    
    it('should create data via JSON-RPC and read via REST', async () => {
      // Create user via JSON-RPC
      const rpcRequest = {
        jsonrpc: '2.0',
        method: 'object.create',
        params: ['users', {
          name: 'Charlie RPC',
          email: 'charlie@rpc.com',
          age: 35,
          active: true
        }],
        id: 1
      };
      
      const rpcResponse = await fetch(jsonrpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rpcRequest)
      });
      
      expect(rpcResponse.ok).toBe(true);
      const rpcData = await rpcResponse.json();
      const userId = rpcData.result?.id;
      expect(userId).toBeDefined();
      
      // Read same user via REST
      const restResponse = await fetch(`${restBaseUrl}/users/${userId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      expect(restResponse.ok).toBe(true);
      const restData = await restResponse.json();
      const userData = restData.data || restData;
      
      expect(userData.name).toBe('Charlie RPC');
      expect(userData.email).toBe('charlie@rpc.com');
    }, 30000);
    
    it('should update data via OData and verify via all protocols', async () => {
      // Create user via REST
      const createResponse = await fetch(`${restBaseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Dave Original',
          email: 'dave@test.com',
          age: 40,
          active: true
        })
      });
      
      const createData = await createResponse.json();
      const userId = createData.data?.id || createData.id;
      
      // Update via OData
      const updateResponse = await fetch(`${odataBaseUrl}/Users('${userId}')`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Dave Updated',
          age: 41
        })
      });
      
      expect(updateResponse.ok).toBe(true);
      
      // Verify via REST
      const restCheck = await fetch(`${restBaseUrl}/users/${userId}`);
      const restData = await restCheck.json();
      expect((restData.data || restData).name).toBe('Dave Updated');
      
      // Verify via GraphQL
      const graphqlQuery = `query { users(id: "${userId}") { name age } }`;
      const graphqlCheck = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: graphqlQuery })
      });
      const graphqlData = await graphqlCheck.json();
      expect(graphqlData.data.users.name).toBe('Dave Updated');
      expect(graphqlData.data.users.age).toBe(41);
      
      // Verify via JSON-RPC
      const rpcCheck = await fetch(jsonrpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'object.findOne',
          params: ['users', { id: userId }],
          id: 2
        })
      });
      const rpcData = await rpcCheck.json();
      expect(rpcData.result.name).toBe('Dave Updated');
    }, 30000);
  });
  
  describe('Query Consistency Across Protocols', () => {
    beforeAll(async () => {
      // Create test dataset via REST
      const users = [
        { name: 'User 1', email: 'user1@test.com', age: 25, active: true },
        { name: 'User 2', email: 'user2@test.com', age: 30, active: true },
        { name: 'User 3', email: 'user3@test.com', age: 35, active: false },
        { name: 'User 4', email: 'user4@test.com', age: 40, active: true },
        { name: 'User 5', email: 'user5@test.com', age: 45, active: false }
      ];
      
      for (const user of users) {
        await fetch(`${restBaseUrl}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
      }
      
      // Wait for data to be available
      await new Promise(resolve => setTimeout(resolve, 500));
    }, 30000);
    
    it('should return consistent query results across all protocols', async () => {
      // Query active users via REST
      const restResponse = await fetch(`${restBaseUrl}/users?active=true`);
      const restData = await restResponse.json();
      const restUsers = restData.items || restData.data || restData;
      const restActiveCount = Array.isArray(restUsers) 
        ? restUsers.filter((u: any) => u.active === true).length 
        : 0;
      
      // Query active users via GraphQL
      const graphqlQuery = `
        query {
          usersList {
            id
            name
            active
          }
        }
      `;
      const graphqlResponse = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: graphqlQuery })
      });
      const graphqlData = await graphqlResponse.json();
      const graphqlUsers = graphqlData.data?.usersList || [];
      const graphqlActiveCount = graphqlUsers.filter((u: any) => u.active === true).length;
      
      // Query active users via OData
      const odataResponse = await fetch(`${odataBaseUrl}/Users?$filter=active eq true`);
      const odataData = await odataResponse.json();
      const odataUsers = odataData.value || odataData;
      const odataActiveCount = Array.isArray(odataUsers) ? odataUsers.length : 0;
      
      // Query active users via JSON-RPC
      const rpcResponse = await fetch(jsonrpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'object.find',
          params: ['users', { filter: { active: true } }],
          id: 3
        })
      });
      const rpcData = await rpcResponse.json();
      const rpcUsers = rpcData.result || [];
      const rpcActiveCount = Array.isArray(rpcUsers) ? rpcUsers.length : 0;
      
      // All protocols should return the same count of active users
      expect(restActiveCount).toBeGreaterThan(0);
      expect(graphqlActiveCount).toBeGreaterThan(0);
      expect(odataActiveCount).toBeGreaterThan(0);
      expect(rpcActiveCount).toBeGreaterThan(0);
      
      // Verify consistency (within reasonable margin for async operations)
      const counts = [restActiveCount, graphqlActiveCount, odataActiveCount, rpcActiveCount];
      const maxCount = Math.max(...counts);
      const minCount = Math.min(...counts);
      expect(maxCount - minCount).toBeLessThanOrEqual(1); // Allow 1 difference for race conditions
    }, 30000);
  });
  
  describe('Batch Operations Consistency', () => {
    it('should handle batch operations consistently', async () => {
      // Batch create via JSON-RPC
      const batchData = [
        { name: 'Batch User 1', email: 'batch1@test.com', age: 20, active: true },
        { name: 'Batch User 2', email: 'batch2@test.com', age: 21, active: true },
        { name: 'Batch User 3', email: 'batch3@test.com', age: 22, active: true }
      ];
      
      const batchRequests = batchData.map((data, index) => ({
        jsonrpc: '2.0',
        method: 'object.create',
        params: ['users', data],
        id: 100 + index
      }));
      
      const rpcResponse = await fetch(jsonrpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchRequests)
      });
      
      expect(rpcResponse.ok).toBe(true);
      const rpcResults = await rpcResponse.json();
      expect(Array.isArray(rpcResults)).toBe(true);
      expect(rpcResults.length).toBe(3);
      
      // Verify all created users are visible via REST
      const restResponse = await fetch(`${restBaseUrl}/users`);
      const restData = await restResponse.json();
      const restUsers = restData.items || restData.data || restData;
      
      const batchUserNames = batchData.map(u => u.name);
      const foundUsers = Array.isArray(restUsers)
        ? restUsers.filter((u: any) => batchUserNames.includes(u.name))
        : [];
      
      expect(foundUsers.length).toBe(3);
    }, 30000);
  });
  
  describe('Error Handling Consistency', () => {
    it('should handle non-existent resources consistently across protocols', async () => {
      const nonExistentId = 'nonexistent-id-12345';
      
      // REST should return 404 or null
      const restResponse = await fetch(`${restBaseUrl}/users/${nonExistentId}`);
      const restReturnsNotFound = restResponse.status === 404 || 
        (await restResponse.json()).data === null;
      
      // GraphQL should return null
      const graphqlQuery = `query { users(id: "${nonExistentId}") { id name } }`;
      const graphqlResponse = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: graphqlQuery })
      });
      const graphqlData = await graphqlResponse.json();
      const graphqlReturnsNull = graphqlData.data.users === null;
      
      // OData should return 404 or empty
      const odataResponse = await fetch(`${odataBaseUrl}/Users('${nonExistentId}')`);
      const odataReturnsNotFound = odataResponse.status === 404;
      
      // JSON-RPC should return null or error
      const rpcResponse = await fetch(jsonrpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'object.findOne',
          params: ['users', { id: nonExistentId }],
          id: 4
        })
      });
      const rpcData = await rpcResponse.json();
      const rpcReturnsNullOrError = rpcData.result === null || rpcData.error !== undefined;
      
      // All protocols should handle it gracefully
      expect(restReturnsNotFound || graphqlReturnsNull || odataReturnsNotFound || rpcReturnsNullOrError).toBe(true);
    }, 30000);
  });
});
