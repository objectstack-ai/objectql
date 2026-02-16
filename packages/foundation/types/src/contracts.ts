/**
 * ObjectQL — Service Contract Re-exports
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Re-exports all IService contract interfaces from @objectstack/spec/contracts.
 * This ensures every package in the monorepo can import service contracts from
 * @objectql/types (the "Constitution") without depending on @objectstack/spec directly.
 *
 * @objectstack/spec is a devDependency — these are compile-time type re-exports
 * with ZERO runtime cost.
 *
 * @see https://protocol.objectstack.ai/docs/guides/kernel-services
 */

// ============================================================================
// Service Contract Interfaces (20+ IService contracts)
// ============================================================================

export type {
    // Core Infrastructure Contracts
    IDataEngine,
    IDataDriver,
    IHttpServer,
    IHttpRequest,
    IHttpResponse,
    IServiceRegistry,
    IBasicServiceRegistry,
    IAdvancedServiceRegistry,
    ISchemaDriver,

    // Plugin Lifecycle Contracts
    IPluginValidator,
    IStartupOrchestrator,
    IPluginLifecycleEvents,
    ITypedEventEmitter,

    // Domain Service Contracts (aligned with CoreServiceName)
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
} from '@objectstack/spec/contracts';

// ============================================================================
// Supporting Types for Service Contracts
// ============================================================================

export type {
    // Driver & Data Engine types
    DriverInterface,
    Logger as SpecLogger,

    // Plugin types
    Plugin as SpecPlugin,
    ValidationResult as SpecValidationResult,
    StartupOptions,
    PluginStartupResult,
    HealthStatus,

    // HTTP types
    RouteHandler,
    Middleware as SpecMiddleware,

    // Cache types
    CacheStats,

    // Search types
    SearchOptions,
    SearchHit,
    SearchResult,

    // Queue types
    QueuePublishOptions,
    QueueMessage,
    QueueHandler,

    // Notification types
    NotificationChannel,
    NotificationMessage,
    NotificationResult,

    // Storage types
    StorageUploadOptions,
    StorageFileInfo,

    // Metadata types
    MetadataWatchCallback,
    MetadataWatchHandle,
    MetadataExportOptions,
    MetadataImportOptions,
    MetadataImportResult,
    MetadataTypeInfo,

    // Auth types
    AuthUser,
    AuthSession,
    AuthResult,

    // Automation types
    AutomationContext,
    AutomationResult,

    // GraphQL types
    GraphQLRequest,
    GraphQLResponse,

    // Analytics types
    AnalyticsQuery,
    AnalyticsResult,
    CubeMeta,

    // Realtime types
    RealtimeEventPayload,
    RealtimeEventHandler,
    RealtimeSubscriptionOptions,

    // Job types
    JobSchedule,
    JobHandler,
    JobExecution,

    // AI types
    AIMessage,
    AIRequestOptions,
    AIResult,

    // Workflow types
    WorkflowTransition as SpecWorkflowTransition,
    WorkflowTransitionResult as SpecWorkflowTransitionResult,
    WorkflowStatus as SpecWorkflowStatus,
} from '@objectstack/spec/contracts';
