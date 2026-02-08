/**
 * ObjectQL Multi-Tenancy Plugin - Mutation Guard
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Logger } from '@objectql/types';
import { TenantIsolationError } from './types';

/**
 * Mutation guard
 * Handles tenant isolation for create, update, and delete operations
 */
export class MutationGuard {
  constructor(
    private tenantField: string,
    private strictMode: boolean,
    private logger: Logger
  ) {}
  
  /**
   * Auto-set tenant_id on new records (beforeCreate hook)
   */
  autoSetTenantId(
    data: any,
    tenantId: string,
    objectName: string
  ): void {
    if (!data) {
      return;
    }
    
    // Check if tenant_id is already set
    if (data[this.tenantField]) {
      if (this.strictMode && data[this.tenantField] !== tenantId) {
        throw new TenantIsolationError(
          `Cross-tenant create attempt: data specifies ${this.tenantField}=${data[this.tenantField]}, but current tenant is ${tenantId}`,
          {
            tenantId,
            objectName,
            operation: 'create',
            reason: 'CROSS_TENANT_CREATE',
          }
        );
      }
      
      this.logger.debug('Tenant ID already set on create data', {
        objectName,
        tenantId: data[this.tenantField],
      });
      return;
    }
    
    // Auto-set tenant_id
    data[this.tenantField] = tenantId;
    
    this.logger.debug('Auto-set tenant ID on create', {
      objectName,
      tenantId,
      field: this.tenantField,
    });
  }
  
  /**
   * Verify tenant_id on update operations
   * Ensures user can only update records in their tenant
   */
  verifyUpdateTenant(
    previousData: any,
    updateData: any,
    tenantId: string,
    objectName: string
  ): void {
    if (!this.strictMode) {
      return;
    }
    
    // Check existing record's tenant_id
    if (previousData && previousData[this.tenantField]) {
      const recordTenantId = previousData[this.tenantField];
      
      if (recordTenantId !== tenantId) {
        throw new TenantIsolationError(
          `Cross-tenant update denied: record belongs to tenant ${recordTenantId}, but current tenant is ${tenantId}`,
          {
            tenantId,
            objectName,
            operation: 'update',
            reason: 'CROSS_TENANT_UPDATE',
          }
        );
      }
    }
    
    // Prevent changing tenant_id in update data
    if (updateData && this.tenantField in updateData) {
      const newTenantId = updateData[this.tenantField];
      
      if (newTenantId !== tenantId) {
        throw new TenantIsolationError(
          `Tenant reassignment denied: cannot change ${this.tenantField} from ${tenantId} to ${newTenantId}`,
          {
            tenantId,
            objectName,
            operation: 'update',
            reason: 'TENANT_REASSIGNMENT',
          }
        );
      }
    }
  }
  
  /**
   * Verify tenant_id on delete operations
   * Ensures user can only delete records in their tenant
   */
  verifyDeleteTenant(
    previousData: any,
    tenantId: string,
    objectName: string
  ): void {
    if (!this.strictMode) {
      return;
    }
    
    // Check existing record's tenant_id
    if (previousData && previousData[this.tenantField]) {
      const recordTenantId = previousData[this.tenantField];
      
      if (recordTenantId !== tenantId) {
        throw new TenantIsolationError(
          `Cross-tenant delete denied: record belongs to tenant ${recordTenantId}, but current tenant is ${tenantId}`,
          {
            tenantId,
            objectName,
            operation: 'delete',
            reason: 'CROSS_TENANT_DELETE',
          }
        );
      }
    }
  }
  
  /**
   * Check if an object should be tenant-isolated
   * Returns false for exempt objects
   */
  shouldIsolate(objectName: string, exemptObjects: string[]): boolean {
    return !exemptObjects.includes(objectName);
  }
}
