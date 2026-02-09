/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Kernel Service Types
 * 
 * Defines the 17 kernel services specified by the ObjectStack protocol.
 * Each service maps to a set of protocol methods governed by the ObjectStackProtocol interface.
 * 
 * @see https://protocol.objectstack.ai/docs/guides/kernel-services
 */

/**
 * The 17 kernel services registered via CoreServiceName.
 * Each service maps to a set of protocol methods.
 */
export type CoreServiceName =
    | 'metadata'
    | 'data'
    | 'analytics'
    | 'auth'
    | 'ui'
    | 'workflow'
    | 'automation'
    | 'realtime'
    | 'notification'
    | 'ai'
    | 'i18n'
    | 'file-storage'
    | 'search'
    | 'cache'
    | 'queue'
    | 'job'
    | 'graphql';

/**
 * Criticality levels for kernel services.
 * - required: System cannot start without this service
 * - core: Falls back to in-memory implementation with a warning if missing
 * - optional: Feature disabled; API returns 501 Not Implemented if missing
 */
export type ServiceCriticality = 'required' | 'core' | 'optional';

/**
 * Service availability status reported via the discovery endpoint.
 */
export type ServiceStatusValue = 'available' | 'degraded' | 'unavailable';

/**
 * Per-service status entry in the discovery response.
 */
export interface ServiceStatus {
    /** Whether the service is enabled */
    readonly enabled: boolean;
    /** Current operational status */
    readonly status: ServiceStatusValue;
    /** Route mount point (if available) */
    readonly route?: string;
    /** Provider name (e.g., 'kernel', plugin name) */
    readonly provider?: string;
    /** Human-readable status message */
    readonly message?: string;
}

/**
 * Service criticality mapping per the kernel-services specification.
 */
export const SERVICE_CRITICALITY: Readonly<Record<CoreServiceName, ServiceCriticality>> = {
    metadata: 'required',
    data: 'required',
    analytics: 'optional',
    auth: 'required',
    ui: 'optional',
    workflow: 'optional',
    automation: 'optional',
    realtime: 'optional',
    notification: 'optional',
    ai: 'optional',
    i18n: 'optional',
    'file-storage': 'optional',
    search: 'optional',
    cache: 'core',
    queue: 'core',
    job: 'core',
    graphql: 'optional',
};

/**
 * Discovery response structure returned by getDiscovery.
 * Clients use this to determine which services are available and adapt UI accordingly.
 */
export interface KernelDiscoveryResponse {
    /** Engine name */
    readonly name: string;
    /** API name identifier for the spec discovery endpoint */
    readonly apiName: string;
    /** Engine version */
    readonly version: string;
    /** Supported protocol transports */
    readonly protocols: readonly string[];
    /** Per-service status map */
    readonly services: Readonly<Record<CoreServiceName, ServiceStatus>>;
    /** Optional capabilities flags */
    readonly capabilities?: {
        readonly search: boolean;
        readonly files: boolean;
        readonly graphql: boolean;
        readonly notifications: boolean;
        readonly analytics: boolean;
        readonly ai: boolean;
        readonly i18n: boolean;
        readonly workflow: boolean;
        readonly websockets: boolean;
    };
    /** Optional endpoint URLs */
    readonly endpoints?: {
        readonly rest?: string;
        readonly graphql?: string;
        readonly websocket?: string;
    };
}
