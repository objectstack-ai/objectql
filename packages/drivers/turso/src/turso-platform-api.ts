/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLError } from '@objectql/types';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for the Turso Platform API client.
 */
export interface TursoPlatformConfig {
    /** Turso organization slug (e.g., 'my-org') */
    orgSlug: string;
    /** Turso API token (from `turso auth api-tokens mint`) */
    apiToken: string;
    /** API base URL override. Default: `'https://api.turso.tech'` */
    baseUrl?: string;
}

// ============================================================================
// Response Types
// ============================================================================

/** Result of creating a new database. */
export interface CreateDatabaseResult {
    /** Database hostname (e.g., 'my-db-my-org.turso.io') */
    hostname: string;
    /** Database name */
    name: string;
}

/** Result of creating a database auth token. */
export interface CreateTokenResult {
    /** JWT auth token */
    jwt: string;
}

/** Database entry from list endpoint. */
export interface DatabaseInfo {
    /** Database name */
    name: string;
    /** Database hostname */
    hostname: string;
    /** Database group */
    group?: string;
    /** Whether the database is a schema database */
    is_schema?: boolean;
}

// ============================================================================
// Turso Platform API Client
// ============================================================================

/**
 * Client for the Turso Platform HTTP API.
 *
 * Wraps REST endpoints for managing databases and auth tokens within
 * a Turso organization. Used by the multi-tenant router for automatic
 * database provisioning and teardown.
 *
 * @see https://docs.turso.tech/api-reference
 *
 * @example
 * ```typescript
 * const api = new TursoPlatformAPI({
 *   orgSlug: 'my-org',
 *   apiToken: process.env.TURSO_API_TOKEN!,
 * });
 *
 * const db = await api.createDatabase('tenant-acme', 'default');
 * console.log(db.hostname); // 'tenant-acme-my-org.turso.io'
 * ```
 */
export class TursoPlatformAPI {
    private readonly baseUrl: string;
    private readonly orgSlug: string;
    private readonly apiToken: string;

    constructor(config: TursoPlatformConfig) {
        if (!config.orgSlug) {
            throw new ObjectQLError({
                code: 'CONFIG_ERROR',
                message: 'TursoPlatformAPI requires an "orgSlug".'
            });
        }
        if (!config.apiToken) {
            throw new ObjectQLError({
                code: 'CONFIG_ERROR',
                message: 'TursoPlatformAPI requires an "apiToken".'
            });
        }

        this.orgSlug = config.orgSlug;
        this.apiToken = config.apiToken;
        this.baseUrl = (config.baseUrl ?? 'https://api.turso.tech').replace(/\/+$/, '');
    }

    // ========================================================================
    // Database Operations
    // ========================================================================

    /**
     * Create a new database in the organization.
     *
     * @param name - Database name (alphanumeric, hyphens allowed)
     * @param group - Optional group name (defaults to 'default')
     */
    async createDatabase(name: string, group?: string): Promise<CreateDatabaseResult> {
        const body: Record<string, unknown> = { name };
        if (group) body.group = group;

        const data = await this.request<{ database: { Hostname: string; Name: string } }>(
            'POST',
            `/v1/organizations/${this.orgSlug}/databases`,
            body
        );

        return {
            hostname: data.database.Hostname,
            name: data.database.Name,
        };
    }

    /**
     * Delete a database from the organization.
     *
     * @param name - Database name to delete
     */
    async deleteDatabase(name: string): Promise<void> {
        await this.request<unknown>(
            'DELETE',
            `/v1/organizations/${this.orgSlug}/databases/${name}`
        );
    }

    /**
     * Create an auth token for a specific database.
     *
     * @param dbName - Database name
     * @param options - Token options (expiration, authorization level)
     */
    async createToken(
        dbName: string,
        options?: { expiration?: string; authorization?: string }
    ): Promise<CreateTokenResult> {
        let path = `/v1/organizations/${this.orgSlug}/databases/${dbName}/auth/tokens`;
        const params: string[] = [];
        if (options?.expiration) params.push(`expiration=${encodeURIComponent(options.expiration)}`);
        if (options?.authorization) params.push(`authorization=${encodeURIComponent(options.authorization)}`);
        if (params.length > 0) path += `?${params.join('&')}`;

        const data = await this.request<{ jwt: string }>('POST', path);
        return { jwt: data.jwt };
    }

    /**
     * List all databases in the organization.
     */
    async listDatabases(): Promise<DatabaseInfo[]> {
        const data = await this.request<{ databases: Array<{ Name: string; Hostname: string; group?: string; is_schema?: boolean }> }>(
            'GET',
            `/v1/organizations/${this.orgSlug}/databases`
        );

        return data.databases.map(db => ({
            name: db.Name,
            hostname: db.Hostname,
            group: db.group,
            is_schema: db.is_schema,
        }));
    }

    // ========================================================================
    // HTTP Helper
    // ========================================================================

    private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
        const url = `${this.baseUrl}${path}`;

        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
        };

        const init: RequestInit = { method, headers };
        if (body !== undefined) {
            init.body = JSON.stringify(body);
        }

        let response: Response;
        try {
            response = await fetch(url, init);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new ObjectQLError({
                code: 'DRIVER_CONNECTION_FAILED',
                message: `Turso Platform API request failed: ${message}`
            });
        }

        if (!response.ok) {
            let errorMessage: string;
            try {
                const errorBody = await response.json() as { error?: string; message?: string };
                errorMessage = errorBody.error || errorBody.message || response.statusText;
            } catch {
                errorMessage = response.statusText;
            }

            throw new ObjectQLError({
                code: 'DRIVER_ERROR',
                message: `Turso Platform API error (${response.status}): ${errorMessage}`
            });
        }

        return response.json() as Promise<T>;
    }
}
