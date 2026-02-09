/**
 * ObjectStack Protocol Implementation
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectStackProtocol } from '@objectstack/spec/api';
import type { IObjectQL, CoreServiceName, ServiceStatus, KernelDiscoveryResponse } from '@objectql/types';
import { ObjectQLError } from '@objectql/types';

/**
 * Default service status map.
 * metadata + data + analytics are kernel-provided; all others require plugins.
 */
const DEFAULT_SERVICES: Readonly<Record<CoreServiceName, ServiceStatus>> = {
    metadata: {
        enabled: true,
        status: 'degraded',
        route: '/api/v1/meta',
        provider: 'kernel',
        message: 'In-memory registry; DB persistence pending',
    },
    data: {
        enabled: true,
        status: 'available',
        route: '/api/v1/data',
        provider: 'kernel',
    },
    analytics: {
        enabled: true,
        status: 'available',
        route: '/api/v1/analytics',
        provider: 'kernel',
    },
    auth: {
        enabled: false,
        status: 'unavailable',
        message: 'Install an auth plugin to enable',
    },
    ui: {
        enabled: false,
        status: 'unavailable',
        message: 'Install a UI plugin to enable',
    },
    workflow: {
        enabled: false,
        status: 'unavailable',
        message: 'Install a workflow plugin to enable',
    },
    automation: {
        enabled: false,
        status: 'unavailable',
        message: 'Install an automation plugin to enable',
    },
    realtime: {
        enabled: false,
        status: 'unavailable',
        message: 'Install a realtime plugin to enable',
    },
    notification: {
        enabled: false,
        status: 'unavailable',
        message: 'Install a notification plugin to enable',
    },
    ai: {
        enabled: false,
        status: 'unavailable',
        message: 'Install an AI plugin to enable',
    },
    i18n: {
        enabled: false,
        status: 'unavailable',
        message: 'Install an i18n plugin to enable',
    },
    'file-storage': {
        enabled: false,
        status: 'unavailable',
        message: 'Install a file-storage plugin to enable',
    },
    search: {
        enabled: false,
        status: 'unavailable',
        message: 'Install a search plugin to enable',
    },
    cache: {
        enabled: false,
        status: 'unavailable',
        message: 'Install a cache plugin to enable',
    },
    queue: {
        enabled: false,
        status: 'unavailable',
        message: 'Install a queue plugin to enable',
    },
    job: {
        enabled: false,
        status: 'unavailable',
        message: 'Install a job plugin to enable',
    },
    graphql: {
        enabled: false,
        status: 'unavailable',
        message: 'Install a graphql plugin to enable',
    },
};

/**
 * Helper: throw a "service not available" error for plugin-required methods.
 */
function notAvailable(service: string, method: string): never {
    throw new ObjectQLError({
        code: 'DRIVER_UNSUPPORTED_OPERATION',
        message: `[${method}] Service '${service}' is not available. Install a ${service} plugin to enable this feature.`
    });
}

/**
 * Bridges the ObjectStack Protocol (Specification) to the ObjectQL Engine (Implementation).
 *
 * This class implements ALL 57 protocol methods defined by the ObjectStackProtocol interface.
 * Kernel-provided services (metadata, data, analytics) delegate to the engine.
 * Plugin-required services throw descriptive errors until a plugin registers the service.
 */
export class ObjectStackProtocolImplementation implements ObjectStackProtocol {
    private services: Record<CoreServiceName, ServiceStatus>;

    constructor(private engine: IObjectQL) {
        this.services = { ...DEFAULT_SERVICES };
    }

    // ========================================================================
    // Service Registration (called by plugins at install time)
    // ========================================================================

    /**
     * Update the status of a service. Called by plugins when they register a service.
     */
    updateServiceStatus(name: CoreServiceName, status: Partial<ServiceStatus>): void {
        this.services[name] = { ...this.services[name], ...status };
    }

    // ========================================================================
    // 1. metadata Service  (7 methods — kernel-provided)
    // ========================================================================

    async getDiscovery(_args?: any) {
        return {
            name: 'ObjectQL Engine',
            apiName: 'objectql',
            version: '4.0.0',
            protocols: ['rest', 'graphql', 'json-rpc', 'odata'],
            services: { ...this.services },
            capabilities: {
                search: true,
                files: true,
                graphql: true,
                notifications: true,
                analytics: true,
                ai: true,
                i18n: true,
                workflow: true,
                websockets: true,
            },
        } as any;
    }

    async getMetaTypes(args?: any): Promise<{ types: string[] }> {
        let types = ['object'];
        if (this.engine.metadata && typeof this.engine.metadata.getTypes === 'function') {
            types = this.engine.metadata.getTypes();
        }
        return { types };
    }

    async getMetaItems(args: { type: string }): Promise<{ type: string; items: any[] }> {
        const { type } = args;
        let items: any[] = [];
        if (this.engine.metadata && typeof this.engine.metadata.list === 'function') {
            items = this.engine.metadata.list(type);
        }
        return { type, items };
    }

    async getMetaItem(args: { type: string; name: string }): Promise<any> {
        const { type, name } = args;
        if (this.engine.metadata && typeof this.engine.metadata.get === 'function') {
            return this.engine.metadata.get(type, name);
        }
        return null;
    }

    async saveMetaItem(args: { type: string; name: string; item?: any }): Promise<{ success: boolean; message?: string }> {
        const { type, name, item } = args;
        if (this.engine.metadata && typeof this.engine.metadata.register === 'function') {
            const data = { ...(item || {}), name };
            this.engine.metadata.register(type, data);
            return { success: true };
        }
        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'Engine does not support saving metadata' });
    }

    async getMetaItemCached(args: { type: string; name: string }): Promise<any> {
        return this.getMetaItem(args);
    }

    async getUiView(args: { object: string; type: 'list' | 'form' }): Promise<any> {
        return null;
    }

    // ========================================================================
    // 2. data Service  (9 methods — kernel-provided)
    // ========================================================================

    async findData(args: { object: string; query?: any }): Promise<any> {
        const { object, query } = args;

        if (typeof (this.engine as any).find === 'function') {
            return await (this.engine as any).find(object, query || {});
        }

        if (typeof (this.engine as any).createContext === 'function') {
            const ctx = (this.engine as any).createContext({ isSystem: true });
            const repo = ctx.object(object);
            return await repo.find(query || {});
        }

        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'Engine does not support find operation' });
    }

    async getData(args: { object: string; id: string }): Promise<any> {
        const { object, id } = args;

        if (typeof (this.engine as any).get === 'function') {
            return await (this.engine as any).get(object, id);
        }

        if (typeof (this.engine as any).createContext === 'function') {
            const ctx = (this.engine as any).createContext({ isSystem: true });
            const repo = ctx.object(object);
            return await repo.findOne(id);
        }

        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'Engine does not support get operation' });
    }

    async createData(args: { object: string; data: any }): Promise<any> {
        const { object, data } = args;

        if (typeof (this.engine as any).create === 'function') {
            return await (this.engine as any).create(object, data);
        }

        if (typeof (this.engine as any).createContext === 'function') {
            const ctx = (this.engine as any).createContext({ isSystem: true });
            const repo = ctx.object(object);
            return await repo.create(data);
        }

        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'Engine does not support create operation' });
    }

    async updateData(args: { object: string; id: string; data: any }): Promise<any> {
        const { object, id, data } = args;

        if (typeof (this.engine as any).update === 'function') {
            return await (this.engine as any).update(object, id, data);
        }

        if (typeof (this.engine as any).createContext === 'function') {
            const ctx = (this.engine as any).createContext({ isSystem: true });
            const repo = ctx.object(object);
            return await repo.update(id, data);
        }

        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'Engine does not support update operation' });
    }

    async deleteData(args: { object: string; id: string }): Promise<{ object: string; id: string; success: boolean }> {
        const { object, id } = args;

        if (typeof (this.engine as any).delete === 'function') {
            const success = await (this.engine as any).delete(object, id);
            return { object, id, success: !!success };
        }

        if (typeof (this.engine as any).createContext === 'function') {
            const ctx = (this.engine as any).createContext({ isSystem: true });
            const repo = ctx.object(object);
            await repo.delete(id);
            return { object, id, success: true };
        }

        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'Engine does not support delete operation' });
    }

    async batchData(args: { object: string; request: { operation: 'create' | 'update' | 'delete' | 'upsert'; records: any[] } }): Promise<any> {
        const { object, request } = args;
        const { operation, records } = request;
        // Sequential execution to preserve ordering and avoid connection pool exhaustion
        const results: any[] = [];

        for (const record of records) {
            switch (operation) {
                case 'create':
                    results.push(await this.createData({ object, data: record }));
                    break;
                case 'update':
                    results.push(await this.updateData({ object, id: record.id, data: record }));
                    break;
                case 'delete':
                    results.push(await this.deleteData({ object, id: record.id || record }));
                    break;
                case 'upsert': {
                    // Try update first; if entity not found, create
                    try {
                        results.push(await this.updateData({ object, id: record.id, data: record }));
                    } catch {
                        results.push(await this.createData({ object, data: record }));
                    }
                    break;
                }
                default:
                    throw new ObjectQLError({ code: 'INVALID_REQUEST', message: `Unsupported batch operation: ${operation}` });
            }
        }

        return { object, operation, results };
    }

    async createManyData(args: { object: string; records: any[]; options?: any }): Promise<any> {
        const { object, records } = args;
        const results: any[] = [];
        for (const record of records) {
            results.push(await this.createData({ object, data: record }));
        }
        return { object, created: results };
    }

    async updateManyData(args: { object: string; records: { id: string; data: any }[]; options?: any }): Promise<any> {
        const { object, records } = args;
        const results: any[] = [];
        for (const record of records) {
            results.push(await this.updateData({ object, id: record.id, data: record.data }));
        }
        return { object, updated: results };
    }

    async deleteManyData(args: { object: string; ids: string[]; options?: any }): Promise<any> {
        const { object, ids } = args;
        const results: any[] = [];
        for (const id of ids) {
            results.push(await this.deleteData({ object, id }));
        }
        return { object, deleted: results };
    }

    // ========================================================================
    // 3. analytics Service  (2 methods — kernel-provided)
    // ========================================================================

    async analyticsQuery(args: any): Promise<any> {
        // Delegate to engine's query service if available
        if (typeof (this.engine as any).queryService?.aggregate === 'function') {
            return await (this.engine as any).queryService.aggregate(args);
        }

        // Basic fallback: use findData + in-memory aggregation
        if (args?.object) {
            const data = await this.findData({ object: args.object, query: args.filters });
            const records = Array.isArray(data) ? data : (data?.value || []);
            return { object: args.object, records, count: records.length };
        }

        throw new ObjectQLError({ code: 'VALIDATION_ERROR', message: 'analyticsQuery requires an object name' });
    }

    async getAnalyticsMeta(args: any): Promise<any> {
        // Auto-generate analytics metadata from SchemaRegistry
        const objectName = args?.object;
        if (!objectName) {
            throw new ObjectQLError({ code: 'VALIDATION_ERROR', message: 'getAnalyticsMeta requires an object name' });
        }

        const objectConfig = this.engine.metadata?.get?.('object', objectName);
        if (!objectConfig) {
            throw new ObjectQLError({ code: 'NOT_FOUND', message: `Object '${objectName}' not found` });
        }

        const config = (objectConfig as any)?.content || objectConfig;
        const fields = config?.fields || {};
        const measures: any[] = [];
        const dimensions: any[] = [];

        for (const [name, field] of Object.entries(fields)) {
            const f = field as any;
            const type = f?.type;
            if (type === 'number' || type === 'currency' || type === 'percent') {
                measures.push({ name, type, aggregations: ['sum', 'avg', 'min', 'max', 'count'] });
            } else if (type === 'date' || type === 'datetime') {
                dimensions.push({ name, type, granularities: ['day', 'week', 'month', 'quarter', 'year'] });
            } else {
                dimensions.push({ name, type });
            }
        }

        return { object: objectName, measures, dimensions };
    }

    // ========================================================================
    // 4. auth Service  (3 methods — plugin required)
    // ========================================================================

    async checkPermission(args: any): Promise<any> {
        notAvailable('auth', 'checkPermission');
    }

    async getObjectPermissions(args: any): Promise<any> {
        notAvailable('auth', 'getObjectPermissions');
    }

    async getEffectivePermissions(args: any): Promise<any> {
        notAvailable('auth', 'getEffectivePermissions');
    }

    // ========================================================================
    // 5. ui Service  (5 methods — plugin required)
    // ========================================================================

    async listViews(args: any): Promise<any> {
        notAvailable('ui', 'listViews');
    }

    async getView(args: any): Promise<any> {
        notAvailable('ui', 'getView');
    }

    async createView(args: any): Promise<any> {
        notAvailable('ui', 'createView');
    }

    async updateView(args: any): Promise<any> {
        notAvailable('ui', 'updateView');
    }

    async deleteView(args: any): Promise<any> {
        notAvailable('ui', 'deleteView');
    }

    // ========================================================================
    // 6. workflow Service  (5 methods — plugin required)
    // ========================================================================

    async getWorkflowConfig(args: any): Promise<any> {
        notAvailable('workflow', 'getWorkflowConfig');
    }

    async getWorkflowState(args: any): Promise<any> {
        notAvailable('workflow', 'getWorkflowState');
    }

    async workflowTransition(args: any): Promise<any> {
        notAvailable('workflow', 'workflowTransition');
    }

    async workflowApprove(args: any): Promise<any> {
        notAvailable('workflow', 'workflowApprove');
    }

    async workflowReject(args: any): Promise<any> {
        notAvailable('workflow', 'workflowReject');
    }

    // ========================================================================
    // 7. automation Service  (1 method — plugin required)
    // ========================================================================

    async triggerAutomation(args: { trigger: string; payload: Record<string, any> }): Promise<{ success: boolean; jobId?: string; result?: any }> {
        notAvailable('automation', 'triggerAutomation');
    }

    // ========================================================================
    // 8. realtime Service  (6 methods — plugin required)
    // ========================================================================

    async realtimeConnect(args: any): Promise<any> {
        notAvailable('realtime', 'realtimeConnect');
    }

    async realtimeDisconnect(args: any): Promise<any> {
        notAvailable('realtime', 'realtimeDisconnect');
    }

    async realtimeSubscribe(args: any): Promise<any> {
        notAvailable('realtime', 'realtimeSubscribe');
    }

    async realtimeUnsubscribe(args: any): Promise<any> {
        notAvailable('realtime', 'realtimeUnsubscribe');
    }

    async setPresence(args: any): Promise<any> {
        notAvailable('realtime', 'setPresence');
    }

    async getPresence(args: any): Promise<any> {
        notAvailable('realtime', 'getPresence');
    }

    // ========================================================================
    // 9. notification Service  (7 methods — plugin required)
    // ========================================================================

    async registerDevice(args: any): Promise<any> {
        notAvailable('notification', 'registerDevice');
    }

    async unregisterDevice(args: any): Promise<any> {
        notAvailable('notification', 'unregisterDevice');
    }

    async getNotificationPreferences(args: any): Promise<any> {
        notAvailable('notification', 'getNotificationPreferences');
    }

    async updateNotificationPreferences(args: any): Promise<any> {
        notAvailable('notification', 'updateNotificationPreferences');
    }

    async listNotifications(args: any): Promise<any> {
        notAvailable('notification', 'listNotifications');
    }

    async markNotificationsRead(args: any): Promise<any> {
        notAvailable('notification', 'markNotificationsRead');
    }

    async markAllNotificationsRead(args: any): Promise<any> {
        notAvailable('notification', 'markAllNotificationsRead');
    }

    // ========================================================================
    // 10. ai Service  (4 methods — plugin required)
    // ========================================================================

    async aiNlq(args: any): Promise<any> {
        notAvailable('ai', 'aiNlq');
    }

    async aiChat(args: any): Promise<any> {
        notAvailable('ai', 'aiChat');
    }

    async aiSuggest(args: any): Promise<any> {
        notAvailable('ai', 'aiSuggest');
    }

    async aiInsights(args: any): Promise<any> {
        notAvailable('ai', 'aiInsights');
    }

    // ========================================================================
    // 11. i18n Service  (3 methods — plugin required)
    // ========================================================================

    async getLocales(args: any): Promise<any> {
        notAvailable('i18n', 'getLocales');
    }

    async getTranslations(args: any): Promise<any> {
        notAvailable('i18n', 'getTranslations');
    }

    async getFieldLabels(args: any): Promise<any> {
        notAvailable('i18n', 'getFieldLabels');
    }

    // ========================================================================
    // Package Management  (6 methods — kernel hub)
    // ========================================================================

    async listPackages(args: any): Promise<any> {
        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'listPackages not implemented' });
    }

    async getPackage(args: any): Promise<any> {
        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'getPackage not implemented' });
    }

    async installPackage(args: any): Promise<any> {
        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'installPackage not implemented' });
    }

    async uninstallPackage(args: any): Promise<any> {
        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'uninstallPackage not implemented' });
    }

    async enablePackage(args: any): Promise<any> {
        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'enablePackage not implemented' });
    }

    async disablePackage(args: any): Promise<any> {
        throw new ObjectQLError({ code: 'DRIVER_UNSUPPORTED_OPERATION', message: 'disablePackage not implemented' });
    }
}
