/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * @objectql/driver-turso
 *
 * Turso/libSQL driver for ObjectQL — edge-first, globally distributed
 * SQLite with embedded replicas and database-per-tenant multi-tenancy.
 *
 * Supports three connection modes:
 * 1. Remote (Cloud): `url: 'libsql://my-db-orgname.turso.io'`
 * 2. Local (Embedded): `url: 'file:./data/local.db'`
 * 3. Embedded Replica (Hybrid): `url` + `syncUrl`
 *
 * @example
 * ```typescript
 * import { createTursoDriver } from '@objectql/driver-turso';
 *
 * const driver = createTursoDriver({
 *   url: process.env.TURSO_DATABASE_URL!,
 *   authToken: process.env.TURSO_AUTH_TOKEN,
 * });
 *
 * await driver.connect();
 * ```
 */

export { TursoDriver, type TursoDriverConfig } from './turso-driver';
export { compileFilter, compileSelect, parseSort, quoteIdentifier, type CompiledQuery, type SelectQueryOptions } from './query-compiler';
export { fieldTypeToSqlite, isJsonFieldType, isBooleanFieldType } from './type-mapper';
export { mapRow, mapRows, serializeValue, serializeRecord } from './result-mapper';

import { TursoDriver, type TursoDriverConfig } from './turso-driver';

/**
 * Factory function to create a TursoDriver instance.
 *
 * @param config - Turso driver configuration
 * @returns A new TursoDriver instance
 *
 * @example
 * ```typescript
 * // Remote (Cloud)
 * const driver = createTursoDriver({
 *   url: 'libsql://my-db-orgname.turso.io',
 *   authToken: process.env.TURSO_AUTH_TOKEN,
 * });
 *
 * // Local (Embedded)
 * const driver = createTursoDriver({
 *   url: 'file:./data/local.db',
 * });
 *
 * // Embedded Replica (Hybrid)
 * const driver = createTursoDriver({
 *   url: 'file:./data/replica.db',
 *   syncUrl: 'libsql://my-db-orgname.turso.io',
 *   authToken: process.env.TURSO_AUTH_TOKEN,
 *   sync: {
 *     intervalSeconds: 60,
 *     onConnect: true,
 *   },
 * });
 * ```
 */
export function createTursoDriver(config: TursoDriverConfig): TursoDriver {
    return new TursoDriver(config);
}
