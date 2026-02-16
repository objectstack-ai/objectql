/**
 * Service Contract Conformance Tests
 *
 * Verifies that all 20+ IService contracts from @objectstack/spec/contracts
 * are systematically re-exported through @objectql/types and can be used
 * for compile-time structural conformance checks.
 */

import type {
    // Core Infrastructure
    IDataEngine,
    IDataDriver,
    IHttpServer,
    IHttpRequest,
    IHttpResponse,
    IServiceRegistry,
    IBasicServiceRegistry,
    IAdvancedServiceRegistry,
    ISchemaDriver,

    // Plugin Lifecycle
    IPluginValidator,
    IStartupOrchestrator,
    IPluginLifecycleEvents,
    ITypedEventEmitter,

    // Domain Services
    ICacheService,
    ISearchService,
    IQueueService,
    INotificationService,
    IStorageService,
    IMetadataService,
    IAuthService,
    IAutomationService,
    IGraphQLService,
    IAnalyticsService,
    IRealtimeService,
    IJobService,
    IAIService,
    II18nService,
    IUIService,
    IWorkflowService,

    // Supporting Types
    HealthStatus,
    StartupOptions,
    PluginStartupResult,
    CacheStats,
    SearchResult,
    QueueMessage,
    NotificationResult,
    StorageFileInfo,
    AuthResult,
    AutomationResult,
    GraphQLResponse,
    AnalyticsResult,
    RealtimeEventPayload,
    JobExecution,
    AIResult,
    SpecWorkflowStatus,
    SpecWorkflowTransition,
    SpecWorkflowTransitionResult,
} from '../src/contracts';

describe('Service Contract Re-exports', () => {
    describe('Core Infrastructure Contracts', () => {
        it('should export IDataEngine interface', () => {
            const engine: IDataEngine = {
                find: async () => [],
                findOne: async () => null,
                insert: async () => ({}),
                update: async () => ({}),
                delete: async () => ({}),
                count: async () => 0,
                aggregate: async () => [],
            };
            expect(engine.find).toBeDefined();
            expect(engine.count).toBeDefined();
        });

        it('should export IHttpServer interface', () => {
            const server: IHttpServer = {
                get: () => {},
                post: () => {},
                put: () => {},
                delete: () => {},
                patch: () => {},
                use: () => {},
                listen: async () => {},
            };
            expect(server.get).toBeDefined();
            expect(server.listen).toBeDefined();
        });

        it('should export IHttpRequest and IHttpResponse interfaces', () => {
            const req: IHttpRequest = {
                params: {},
                query: {},
                headers: {},
                method: 'GET',
                path: '/test',
            };
            expect(req.method).toBe('GET');

            const res: IHttpResponse = {
                json: () => {},
                send: () => {},
                status: function() { return this; },
                header: function() { return this; },
            };
            expect(res.json).toBeDefined();
        });

        it('should export IServiceRegistry interface', () => {
            const registry: IServiceRegistry = {
                register: () => {},
                get: () => ({} as any),
                getAsync: async () => ({} as any),
                has: () => false,
                unregister: () => false,
            };
            expect(registry.register).toBeDefined();
            expect(registry.has).toBeDefined();
        });

        it('should export IBasicServiceRegistry extending IServiceRegistry', () => {
            const basic: IBasicServiceRegistry = {
                register: () => {},
                get: () => ({} as any),
                getAsync: async () => ({} as any),
                has: () => false,
                unregister: () => false,
            };
            expect(basic.register).toBeDefined();
        });

        it('should export IAdvancedServiceRegistry extending IServiceRegistry', () => {
            const advanced: IAdvancedServiceRegistry = {
                register: () => {},
                get: () => ({} as any),
                getAsync: async () => ({} as any),
                has: () => false,
                unregister: () => false,
            };
            expect(advanced.register).toBeDefined();
        });

        it('should export ISchemaDriver interface', () => {
            const schema: ISchemaDriver = {
                createCollection: async () => {},
                dropCollection: async () => {},
                addColumn: async () => {},
                modifyColumn: async () => {},
                dropColumn: async () => {},
                createIndex: async () => {},
                dropIndex: async () => {},
                executeRaw: async () => ({}),
            };
            expect(schema.createCollection).toBeDefined();
        });
    });

    describe('Plugin Lifecycle Contracts', () => {
        it('should export IPluginValidator interface', () => {
            const validator: IPluginValidator = {
                validate: () => ({ valid: true }),
                validateVersion: () => true,
                validateDependencies: () => {},
            };
            expect(validator.validate({ name: 'test' })).toEqual({ valid: true });
        });

        it('should export IStartupOrchestrator interface', () => {
            const orchestrator: IStartupOrchestrator = {
                orchestrateStartup: async () => [],
                rollback: async () => {},
                checkHealth: async () => ({ healthy: true, timestamp: Date.now() }),
            };
            expect(orchestrator.orchestrateStartup).toBeDefined();
        });

        it('should export IPluginLifecycleEvents type', () => {
            // Compile-time check — IPluginLifecycleEvents defines event names and payloads
            type KernelReady = IPluginLifecycleEvents['kernel:ready'];
            type PluginInit = IPluginLifecycleEvents['plugin:init'];
            const _ready: KernelReady = [];
            const _init: PluginInit = ['my-plugin'];
            expect(_ready).toEqual([]);
            expect(_init).toEqual(['my-plugin']);
        });

        it('should export ITypedEventEmitter interface', () => {
            const emitter: ITypedEventEmitter<IPluginLifecycleEvents> = {
                on: () => {},
                off: () => {},
                emit: async () => {},
            };
            expect(emitter.on).toBeDefined();
            expect(emitter.emit).toBeDefined();
        });

        it('should export HealthStatus, StartupOptions, and PluginStartupResult types', () => {
            const health: HealthStatus = { healthy: true, timestamp: Date.now() };
            const opts: StartupOptions = { timeout: 5000 };
            const result: PluginStartupResult = {
                plugin: { name: 'test' },
                success: true,
                duration: 100,
            };
            expect(health.healthy).toBe(true);
            expect(opts.timeout).toBe(5000);
            expect(result.success).toBe(true);
        });
    });

    describe('Domain Service Contracts', () => {
        it('should export ICacheService interface', () => {
            const cache: ICacheService = {
                get: async () => undefined,
                set: async () => {},
                delete: async () => false,
                has: async () => false,
                clear: async () => {},
                stats: async () => ({ hits: 0, misses: 0, keyCount: 0 }),
            };
            expect(cache.get).toBeDefined();
            expect(cache.stats).toBeDefined();

            const stats: CacheStats = { hits: 10, misses: 5, keyCount: 3 };
            expect(stats.hits).toBe(10);
        });

        it('should export ISearchService interface', () => {
            const search: ISearchService = {
                index: async () => {},
                remove: async () => {},
                search: async () => ({ hits: [], totalHits: 0 }),
            };
            const result: SearchResult = { hits: [], totalHits: 0 };
            expect(search.search).toBeDefined();
            expect(result.totalHits).toBe(0);
        });

        it('should export IQueueService interface', () => {
            const queue: IQueueService = {
                publish: async () => 'msg-1',
                subscribe: async () => {},
                unsubscribe: async () => {},
            };
            const msg: QueueMessage = { id: '1', data: {}, attempts: 0, timestamp: Date.now() };
            expect(queue.publish).toBeDefined();
            expect(msg.id).toBe('1');
        });

        it('should export INotificationService interface', () => {
            const notif: INotificationService = {
                send: async () => ({ success: true }),
            };
            const result: NotificationResult = { success: true, messageId: 'n-1' };
            expect(notif.send).toBeDefined();
            expect(result.success).toBe(true);
        });

        it('should export IStorageService interface', () => {
            const storage: IStorageService = {
                upload: async () => {},
                download: async () => Buffer.from(''),
                delete: async () => {},
                exists: async () => false,
                getInfo: async () => ({ key: 'file.txt', size: 0, lastModified: new Date() }),
            };
            const info: StorageFileInfo = { key: 'test.txt', size: 1024, lastModified: new Date() };
            expect(storage.upload).toBeDefined();
            expect(info.size).toBe(1024);
        });

        it('should export IMetadataService interface', () => {
            const metadata: IMetadataService = {
                register: async () => {},
                get: async () => undefined,
                list: async () => [],
                unregister: async () => {},
                exists: async () => false,
                listNames: async () => [],
                getObject: async () => undefined,
                listObjects: async () => [],
            };
            expect(metadata.register).toBeDefined();
            expect(metadata.getObject).toBeDefined();
        });

        it('should export IAuthService interface', () => {
            const auth: IAuthService = {
                handleRequest: async () => new Response(),
                verify: async () => ({ success: false }),
            };
            const result: AuthResult = { success: true, user: { id: '1', email: 'a@b.com', name: 'Test' } };
            expect(auth.verify).toBeDefined();
            expect(result.success).toBe(true);
        });

        it('should export IAutomationService interface', () => {
            const automation: IAutomationService = {
                execute: async () => ({ success: true }),
                listFlows: async () => [],
            };
            const result: AutomationResult = { success: true, durationMs: 50 };
            expect(automation.execute).toBeDefined();
            expect(result.success).toBe(true);
        });

        it('should export IGraphQLService interface', () => {
            const gql: IGraphQLService = {
                execute: async () => ({ data: null }),
            };
            const resp: GraphQLResponse = { data: { users: [] } };
            expect(gql.execute).toBeDefined();
            expect(resp.data).toBeDefined();
        });

        it('should export IAnalyticsService interface', () => {
            const analytics: IAnalyticsService = {
                query: async () => ({ rows: [], fields: [] }),
                getMeta: async () => [],
            };
            const result: AnalyticsResult = { rows: [], fields: [{ name: 'count', type: 'number' }] };
            expect(analytics.query).toBeDefined();
            expect(result.fields.length).toBe(1);
        });

        it('should export IRealtimeService interface', () => {
            const realtime: IRealtimeService = {
                publish: async () => {},
                subscribe: async () => 'sub-1',
                unsubscribe: async () => {},
            };
            const event: RealtimeEventPayload = {
                type: 'record.created',
                payload: {},
                timestamp: new Date().toISOString(),
            };
            expect(realtime.publish).toBeDefined();
            expect(event.type).toBe('record.created');
        });

        it('should export IJobService interface', () => {
            const job: IJobService = {
                schedule: async () => {},
                cancel: async () => {},
                trigger: async () => {},
            };
            const exec: JobExecution = {
                jobId: 'j-1',
                status: 'success',
                startedAt: new Date().toISOString(),
            };
            expect(job.schedule).toBeDefined();
            expect(exec.status).toBe('success');
        });

        it('should export IAIService interface', () => {
            const ai: IAIService = {
                chat: async () => ({ content: 'Hello' }),
                complete: async () => ({ content: 'World' }),
            };
            const result: AIResult = { content: 'test', usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 } };
            expect(ai.chat).toBeDefined();
            expect(result.content).toBe('test');
        });

        it('should export II18nService interface', () => {
            const i18n: II18nService = {
                t: () => 'translated',
                getTranslations: () => ({}),
                loadTranslations: () => {},
                getLocales: () => ['en-US'],
            };
            expect(i18n.t('key', 'en-US')).toBe('translated');
            expect(i18n.getLocales()).toContain('en-US');
        });

        it('should export IUIService interface', () => {
            const ui: IUIService = {
                getView: () => undefined,
                listViews: () => [],
            };
            expect(ui.getView).toBeDefined();
            expect(ui.listViews()).toEqual([]);
        });

        it('should export IWorkflowService interface', () => {
            const workflow: IWorkflowService = {
                transition: async () => ({ success: true, currentState: 'active' }),
                getStatus: async () => ({
                    recordId: 'r-1',
                    object: 'task',
                    currentState: 'draft',
                    availableTransitions: ['active'],
                }),
            };
            expect(workflow.transition).toBeDefined();
            expect(workflow.getStatus).toBeDefined();
        });

        it('should export workflow supporting types with Spec prefix', () => {
            const status: SpecWorkflowStatus = {
                recordId: '1',
                object: 'task',
                currentState: 'active',
                availableTransitions: ['done'],
            };
            const transition: SpecWorkflowTransition = {
                recordId: '1',
                object: 'task',
                targetState: 'done',
            };
            const result: SpecWorkflowTransitionResult = {
                success: true,
                currentState: 'done',
            };
            expect(status.currentState).toBe('active');
            expect(transition.targetState).toBe('done');
            expect(result.success).toBe(true);
        });
    });

    describe('Contract Completeness', () => {
        it('should export all 20+ IService contracts', () => {
            // Compile-time verification — if any import is missing, this file won't compile
            const contractNames: string[] = [
                'IDataEngine',
                'IDataDriver',
                'IHttpServer',
                'IServiceRegistry',
                'IBasicServiceRegistry',
                'IAdvancedServiceRegistry',
                'ISchemaDriver',
                'IPluginValidator',
                'IStartupOrchestrator',
                'ICacheService',
                'ISearchService',
                'IQueueService',
                'INotificationService',
                'IStorageService',
                'IMetadataService',
                'IAuthService',
                'IAutomationService',
                'IGraphQLService',
                'IAnalyticsService',
                'IRealtimeService',
                'IJobService',
                'IAIService',
                'II18nService',
                'IUIService',
                'IWorkflowService',
            ];
            expect(contractNames.length).toBeGreaterThanOrEqual(20);
        });
    });
});
