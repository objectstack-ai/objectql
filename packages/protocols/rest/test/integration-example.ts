/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Integration Example: Demonstrates the new standardized API response format
 * 
 * This file is for documentation purposes and shows how the API responses
 * look with the new standardized format.
 */

import { ObjectQL } from '@objectql/core';
import { createRESTHandler } from '../src/adapters/rest';
import { Driver } from '@objectql/types';

// Example: Setting up ObjectQL with a simple in-memory driver
class InMemoryDriver implements Driver {
    private data: Record<string, any[]> = {};

    async init() {}
    
    async find(objectName: string, query: any) {
        let items = this.data[objectName] || [];
        
        // Apply skip and limit for pagination
        if (query) {
            if (query.skip) {
                items = items.slice(query.skip);
            }
            if (query.limit) {
                items = items.slice(0, query.limit);
            }
        }
        
        return items;
    }
    
    async findOne(objectName: string, id: string | number) {
        const items = this.data[objectName] || [];
        return items.find(item => item.id === String(id)) || null;
    }
    
    async create(objectName: string, data: any) {
        if (!this.data[objectName]) {
            this.data[objectName] = [];
        }
        const newItem = { ...data, id: String(Date.now()) };
        this.data[objectName].push(newItem);
        return newItem;
    }
    
    async update(objectName: string, id: string | number, data: any) {
        const items = this.data[objectName] || [];
        const index = items.findIndex(item => item.id === String(id));
        if (index >= 0) {
            this.data[objectName][index] = { ...items[index], ...data };
            return this.data[objectName][index];
        }
        return null;
    }
    
    async delete(objectName: string, id: string | number) {
        const items = this.data[objectName] || [];
        const index = items.findIndex(item => item.id === String(id));
        if (index >= 0) {
            this.data[objectName].splice(index, 1);
            return 1;
        }
        return 0;
    }
    
    async count(objectName: string) {
        return (this.data[objectName] || []).length;
    }
    
    // Seed some sample data
    seed(objectName: string, items: any[]) {
        this.data[objectName] = items;
    }
}

// Initialize ObjectQL
const driver = new InMemoryDriver();
const app = new ObjectQL({
    datasources: {
        default: driver
    }
});

// Register a simple object schema
app.metadata.register('object', {
    type: 'object',
    id: 'contract',
    content: {
        name: 'contract',
        label: 'Contract',
        fields: {
            name: { type: 'text', label: 'Contract Name' },
            amount: { type: 'number', label: 'Amount' },
            status: { type: 'text', label: 'Status' }
        }
    }
});

// Seed sample data
driver.seed('contract', [
    { id: '1', name: 'Contract A', amount: 5000, status: 'active' },
    { id: '2', name: 'Contract B', amount: 3000, status: 'pending' },
    { id: '3', name: 'Contract C', amount: 7500, status: 'active' },
    { id: '4', name: 'Contract D', amount: 2000, status: 'completed' },
    { id: '5', name: 'Contract E', amount: 9000, status: 'active' },
]);

/**
 * Example 1: List all contracts (no pagination)
 * 
 * Request:  GET /api/data/contract
 * 
 * Response:
 * {
 *   "items": [
 *     { "id": "1", "name": "Contract A", "amount": 5000, "status": "active" },
 *     { "id": "2", "name": "Contract B", "amount": 3000, "status": "pending" },
 *     { "id": "3", "name": "Contract C", "amount": 7500, "status": "active" },
 *     { "id": "4", "name": "Contract D", "amount": 2000, "status": "completed" },
 *     { "id": "5", "name": "Contract E", "amount": 9000, "status": "active" }
 *   ]
 * }
 */

/**
 * Example 2: List contracts with pagination (first page)
 * 
 * Request:  GET /api/data/contract?limit=2&skip=0
 * 
 * Response:
 * {
 *   "items": [
 *     { "id": "1", "name": "Contract A", "amount": 5000, "status": "active" },
 *     { "id": "2", "name": "Contract B", "amount": 3000, "status": "pending" }
 *   ],
 *   "meta": {
 *     "total": 5,
 *     "page": 1,
 *     "size": 2,
 *     "pages": 3,
 *     "has_next": true
 *   }
 * }
 */

/**
 * Example 3: List contracts with pagination (second page)
 * 
 * Request:  GET /api/data/contract?limit=2&skip=2
 * 
 * Response:
 * {
 *   "items": [
 *     { "id": "3", "name": "Contract C", "amount": 7500, "status": "active" },
 *     { "id": "4", "name": "Contract D", "amount": 2000, "status": "completed" }
 *   ],
 *   "meta": {
 *     "total": 5,
 *     "page": 2,
 *     "size": 2,
 *     "pages": 3,
 *     "has_next": true
 *   }
 * }
 */

/**
 * Example 4: Get a single contract
 * 
 * Request:  GET /api/data/contract/1
 * 
 * Response:
 * {
 *   "data": {
 *     "id": "1",
 *     "name": "Contract A",
 *     "amount": 5000,
 *     "status": "active"
 *   }
 * }
 */

/**
 * Example 5: Create a new contract
 * 
 * Request:  POST /api/data/contract
 * Body:     { "name": "Contract F", "amount": 4500, "status": "pending" }
 * 
 * Response:
 * {
 *   "data": {
 *     "id": "6",
 *     "name": "Contract F",
 *     "amount": 4500,
 *     "status": "pending"
 *   }
 * }
 */

/**
 * Example 6: Update a contract
 * 
 * Request:  PUT /api/data/contract/1
 * Body:     { "status": "completed" }
 * 
 * Response:
 * {
 *   "data": {
 *     "id": "1",
 *     "name": "Contract A",
 *     "amount": 5000,
 *     "status": "completed"
 *   }
 * }
 */

/**
 * Example 7: Delete a contract
 * 
 * Request:  DELETE /api/data/contract/1
 * 
 * Response:
 * {
 *   "data": {
 *     "id": "1",
 *     "deleted": true
 *   }
 * }
 */

/**
 * Example 8: Error response (not found)
 * 
 * Request:  GET /api/data/contract/999
 * 
 * Response:
 * {
 *   "error": {
 *     "code": "NOT_FOUND",
 *     "message": "Record not found"
 *   }
 * }
 */

export { app, driver };
