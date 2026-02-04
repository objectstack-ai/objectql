/**
 * ObjectStack Protocol Implementation
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectStackProtocol } from '@objectstack/spec/api';
import { IObjectQL } from '@objectql/types';

/**
 * Bridges the ObjectStack Protocol (Specification) to the ObjectQL Engine (Implementation)
 */
export class ObjectStackProtocolImplementation implements ObjectStackProtocol {
    constructor(private engine: IObjectQL) {}

    /**
     * Get API Discovery Document
     */
    async getDiscovery(args: any): Promise<any> {
        return {
            name: 'ObjectQL Engine',
            version: '4.0.0',
            protocols: ['rest', 'graphql', 'json-rpc', 'odata'],
            auth: {
                type: 'bearer',
                url: '/auth/token'
            }
        };
    }

    /**
     * Get Metadata Types (e.g., ['object', 'action'])
     */
    async getMetaTypes(args: any): Promise<{ types: string[] }> {
        let types = ['object'];
        if (this.engine.metadata && typeof this.engine.metadata.getTypes === 'function') {
            types = this.engine.metadata.getTypes();
        }
        return { types };
    }

    /**
     * Get Metadata Items for a Type
     */
    async getMetaItems(args: { type: string }): Promise<{ type: string; items: any[] }> {
        const { type } = args;
        let items: any[] = [];
        if (this.engine.metadata && typeof this.engine.metadata.list === 'function') {
            items = this.engine.metadata.list(type);
        }
        return { type, items };
    }

    /**
     * Get Metadata Item
     */
    async getMetaItem(args: { type: string; name: string }): Promise<any> {
        const { type, name } = args;
        if (this.engine.metadata && typeof this.engine.metadata.get === 'function') {
            return this.engine.metadata.get(type, name);
        }
        return null;
    }

    /**
     * Get Cached Metadata Item
     */
    async getMetaItemCached(args: { type: string; name: string }): Promise<any> {
        // Fallback to non-cached version for now
        return this.getMetaItem(args);
    }

    /**
     * Get UI View
     */
    async getUiView(args: { object: string; type: 'list' | 'form' }): Promise<any> {
        return null;
    }

    /**
     * Find Data Records
     */
    async findData(args: { object: string; query?: any }): Promise<any> {
        const { object, query } = args;
        
        // Use direct kernel method if available (preferred)
        if (typeof (this.engine as any).find === 'function') {
            const result = await (this.engine as any).find(object, query || {});
            return result;
        }

        // Fallback to createContext (if engine is IObjectQL)
        if (typeof (this.engine as any).createContext === 'function') {
            const ctx = (this.engine as any).createContext({ isSystem: true });
            try {
                const repo = ctx.object(object);
                return await repo.find(query || {});
            } catch (error: any) {
                throw new Error(`Data access failed: ${error.message}`);
            }
        }

        throw new Error('Engine does not support find operation');
    }

    /**
     * Count Data Records
     */
    async countData(args: { object: string; query?: any }): Promise<number> {
        const { object, query } = args;
        // Basic fallback
        const result = await this.findData(args);
        return Array.isArray(result) ? result.length : (result.value ? result.value.length : 0);
    }


    /**
     * Get Single Data Record
     */
    async getData(args: { object: string; id: string }): Promise<any> {
        const { object, id } = args;
        
        if (typeof (this.engine as any).get === 'function') {
            return await (this.engine as any).get(object, id);
        }
        
        if (typeof (this.engine as any).createContext === 'function') {
            const ctx = (this.engine as any).createContext({ isSystem: true });
            try {
                const repo = ctx.object(object);
                return await repo.findOne(id);
            } catch (error: any) {
                throw new Error(`Data retrieval failed: ${error.message}`);
            }
        }
        
        throw new Error('Engine does not support get operation');
    }

    /**
     * Create Data Record
     */
    async createData(args: { object: string; data: any }): Promise<any> {
        const { object, data } = args;

        if (typeof (this.engine as any).create === 'function') {
            return await (this.engine as any).create(object, data);
        }
        
        if (typeof (this.engine as any).createContext === 'function') {
            const ctx = (this.engine as any).createContext({ isSystem: true });
            try {
                const repo = ctx.object(object);
                // Protocol expects returned data
                return await repo.create(data);
            } catch (error: any) {
                throw new Error(`Data creation failed: ${error.message}`);
            }
        }
        
        throw new Error('Engine does not support create operation');
    }

    /**
     * Update Data Record
     */
    async updateData(args: { object: string; id: string; data: any }): Promise<any> {
        const { object, id, data } = args;

        if (typeof (this.engine as any).update === 'function') {
            return await (this.engine as any).update(object, id, data);
        }

        if (typeof (this.engine as any).createContext === 'function') {
            const ctx = (this.engine as any).createContext({ isSystem: true });
            try {
                const repo = ctx.object(object);
                return await repo.update(id, data);
            } catch (error: any) {
                 throw new Error(`Data update failed: ${error.message}`);
            }
        }

        throw new Error('Engine does not support update operation');
    }

    /**
     * Delete Data Record
     */
    async deleteData(args: { object: string; id: string }): Promise<{ object: string; id: string; success: boolean }> {
        const { object, id } = args;

        if (typeof (this.engine as any).delete === 'function') {
            const success = await (this.engine as any).delete(object, id);
            return { object, id, success: !!success };
        }

        if (typeof (this.engine as any).createContext === 'function') {
            const ctx = (this.engine as any).createContext({ isSystem: true });
            try {
                const repo = ctx.object(object);
                await repo.delete(id);
                return { object, id, success: true };
            } catch (error: any) {
                throw new Error(`Data deletion failed: ${error.message}`);
            }
        }

        throw new Error('Engine does not support delete operation');
    }

    /**
     * Create Many Data Records
     */
    async createManyData(args: { object: string; records: any[]; options?: any }): Promise<any> {
        throw new Error('createManyData not implemented');
    }

    /**
     * Update Many Data Records
     */
    async updateManyData(args: { object: string; records: { id: string; data: any }[]; options?: any }): Promise<any> {
        throw new Error('updateManyData not implemented');
    }

    /**
     * Delete Many Data Records
     */
    async deleteManyData(args: { object: string; ids: string[]; options?: any }): Promise<any> {
         throw new Error('deleteManyData not implemented');
    }

    /**
     * Batch Operations
     */
    async batchData(args: { object: string; request: { operation: 'create' | 'update' | 'delete' | 'upsert'; records: any[] } }): Promise<any> {
        throw new Error('batchData not implemented');
    }

    /**
     * Execute Action/Operation
     */
    async performAction(args: { object: string; id?: string; action: string; args?: any }): Promise<any> {
        // Not implemented in this shim yet
        throw new Error('Action execution not implemented in protocol shim');
    }

    /**
     * Analytics Query - Execute analytics query
     */
    async analyticsQuery(args: any): Promise<any> {
        throw new Error('analyticsQuery not implemented');
    }

    /**
     * Get Analytics Metadata
     */
    async getAnalyticsMeta(args: any): Promise<any> {
        throw new Error('getAnalyticsMeta not implemented');
    }

    /**
     * Trigger Automation
     */
    async triggerAutomation(args: { trigger: string; payload: Record<string, any> }): Promise<{ success: boolean; jobId?: string; result?: any }> {
        throw new Error('triggerAutomation not implemented');
    }

    /**
     * List Spaces (Hub/Workspace Management)
     */
    async listSpaces(args: any): Promise<any> {
        throw new Error('listSpaces not implemented');
    }

    /**
     * Create Space (Hub/Workspace Management)
     */
    async createSpace(args: any): Promise<any> {
        throw new Error('createSpace not implemented');
    }

    /**
     * Install Plugin (Hub/Extension Management)
     */
    async installPlugin(args: any): Promise<any> {
        throw new Error('installPlugin not implemented');
    }
}
