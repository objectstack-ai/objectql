/**
 * ObjectQL Multi-Tenancy Plugin - Query Filter Injector
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Logger } from '@objectql/types';
import { TenantIsolationError } from './types';

/**
 * Query filter injector
 * Automatically injects tenant_id filters into queries
 */
export class QueryFilterInjector {
  constructor(
    private tenantField: string,
    private strictMode: boolean,
    private logger: Logger
  ) {}
  
  /**
   * Inject tenant filter into a query object
   * Modifies the query in-place to add tenant_id constraint
   */
  injectTenantFilter(
    query: any,
    tenantId: string,
    objectName: string
  ): void {
    if (!query) {
      return;
    }
    
    // Handle different query formats
    
    // If query has a 'filters' array (ObjectQL format)
    if (Array.isArray(query.filters)) {
      query.filters.push({
        field: this.tenantField,
        operator: 'eq',
        value: tenantId,
      });
      this.logger.debug('Injected tenant filter into filters array', {
        objectName,
        tenantId,
        field: this.tenantField,
      });
      return;
    }
    
    // If query has a 'where' object (Knex/SQL format)
    if (query.where && typeof query.where === 'object') {
      // Check for existing tenant_id in where clause
      if (this.strictMode && query.where[this.tenantField]) {
        const existingTenantId = query.where[this.tenantField];
        if (existingTenantId !== tenantId) {
          throw new TenantIsolationError(
            `Cross-tenant query attempt detected: query specifies ${this.tenantField}=${existingTenantId}, but current tenant is ${tenantId}`,
            {
              tenantId,
              objectName,
              operation: 'query',
              reason: 'CROSS_TENANT_QUERY',
            }
          );
        }
      }
      
      query.where[this.tenantField] = tenantId;
      this.logger.debug('Injected tenant filter into where clause', {
        objectName,
        tenantId,
        field: this.tenantField,
      });
      return;
    }
    
    // If query is a plain object (simple key-value filters)
    if (typeof query === 'object' && !Array.isArray(query)) {
      // Check for existing tenant_id
      if (this.strictMode && query[this.tenantField]) {
        const existingTenantId = query[this.tenantField];
        if (existingTenantId !== tenantId) {
          throw new TenantIsolationError(
            `Cross-tenant query attempt detected: query specifies ${this.tenantField}=${existingTenantId}, but current tenant is ${tenantId}`,
            {
              tenantId,
              objectName,
              operation: 'query',
              reason: 'CROSS_TENANT_QUERY',
            }
          );
        }
      }
      
      query[this.tenantField] = tenantId;
      this.logger.debug('Injected tenant filter into query object', {
        objectName,
        tenantId,
        field: this.tenantField,
      });
    }
  }
  
  /**
   * Verify that a query respects tenant isolation
   * Throws error if query attempts to access another tenant's data
   */
  verifyTenantFilter(
    query: any,
    tenantId: string,
    objectName: string
  ): void {
    if (!this.strictMode || !query) {
      return;
    }
    
    // Check filters array
    if (Array.isArray(query.filters)) {
      const tenantFilter = query.filters.find(
        (f: any) => f.field === this.tenantField
      );
      
      if (tenantFilter && tenantFilter.value !== tenantId) {
        throw new TenantIsolationError(
          `Cross-tenant query denied: attempting to access tenant ${tenantFilter.value} while current tenant is ${tenantId}`,
          {
            tenantId,
            objectName,
            operation: 'query',
            reason: 'CROSS_TENANT_DENIED',
          }
        );
      }
    }
    
    // Check where clause
    if (query.where && typeof query.where === 'object') {
      const existingTenantId = query.where[this.tenantField];
      if (existingTenantId && existingTenantId !== tenantId) {
        throw new TenantIsolationError(
          `Cross-tenant query denied: attempting to access tenant ${existingTenantId} while current tenant is ${tenantId}`,
          {
            tenantId,
            objectName,
            operation: 'query',
            reason: 'CROSS_TENANT_DENIED',
          }
        );
      }
    }
    
    // Check plain object
    if (typeof query === 'object' && !Array.isArray(query)) {
      const existingTenantId = query[this.tenantField];
      if (existingTenantId && existingTenantId !== tenantId) {
        throw new TenantIsolationError(
          `Cross-tenant query denied: attempting to access tenant ${existingTenantId} while current tenant is ${tenantId}`,
          {
            tenantId,
            objectName,
            operation: 'query',
            reason: 'CROSS_TENANT_DENIED',
          }
        );
      }
    }
  }
}
