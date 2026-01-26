/**
 * ObjectQL Security Plugin - Field Masker
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { PermissionConfig } from '@objectql/types';
import type { SecurityContext } from './types';
import { PermissionLoader } from './permission-loader';

/**
 * Field Masker
 * 
 * Implements Field-Level Security (FLS) by:
 * 1. Removing sensitive fields from result sets based on user permissions
 * 2. Masking sensitive field values (e.g., credit cards, SSN)
 */
export class FieldMasker {
  private loader: PermissionLoader;
  
  constructor(loader: PermissionLoader) {
    this.loader = loader;
  }
  
  /**
   * Apply field-level security to query results
   * 
   * Removes or masks fields based on user permissions.
   * This is called after data is retrieved from the database.
   */
  async applyFieldLevelSecurity(
    objectName: string,
    records: any[],
    context: SecurityContext,
    operation: 'read' | 'update' = 'read'
  ): Promise<any[]> {
    const config = await this.loader.load(objectName);
    
    if (!config) {
      return records; // No security config
    }
    
    const user = context.user;
    if (!user) {
      // No user context, remove all restricted fields
      return this.removeAllRestrictedFields(records, config);
    }
    
    const userRoles = user.roles || [];
    
    // Process each record
    return records.map(record => 
      this.processRecord(record, config, userRoles, operation)
    );
  }
  
  /**
   * Apply field-level security to a single record
   */
  async applyToRecord(
    objectName: string,
    record: any,
    context: SecurityContext,
    operation: 'read' | 'update' = 'read'
  ): Promise<any> {
    const results = await this.applyFieldLevelSecurity(
      objectName,
      [record],
      context,
      operation
    );
    return results[0] || record;
  }
  
  /**
   * Process a single record - remove unauthorized fields and apply masking
   */
  private processRecord(
    record: any,
    config: PermissionConfig,
    userRoles: string[],
    operation: 'read' | 'update'
  ): any {
    const processedRecord = { ...record };
    
    // Apply field permissions
    if (config.field_permissions) {
      for (const [fieldName, fieldPerm] of Object.entries(config.field_permissions)) {
        const allowedRoles = (fieldPerm as any)[operation];
        
        if (allowedRoles && Array.isArray(allowedRoles)) {
          const hasAccess = userRoles.some(role => allowedRoles.includes(role));
          
          if (!hasAccess) {
            delete processedRecord[fieldName];
          }
        }
      }
    }
    
    // Apply field masking
    if (config.field_masking && operation === 'read') {
      for (const [fieldName, maskConfig] of Object.entries(config.field_masking)) {
        // Skip if field was already removed by permissions
        if (!(fieldName in processedRecord)) {
          continue;
        }
        
        const canSeeUnmasked = userRoles.some(role => 
          (maskConfig as any).visible_to.includes(role)
        );
        
        if (!canSeeUnmasked) {
          processedRecord[fieldName] = this.maskValue(
            processedRecord[fieldName],
            (maskConfig as any).mask_format
          );
        }
      }
    }
    
    return processedRecord;
  }
  
  /**
   * Remove all fields that have any restrictions
   */
  private removeAllRestrictedFields(
    records: any[],
    config: PermissionConfig
  ): any[] {
    const restrictedFields = new Set<string>();
    
    if (config.field_permissions) {
      Object.keys(config.field_permissions).forEach(field => {
        restrictedFields.add(field);
      });
    }
    
    if (config.field_masking) {
      Object.keys(config.field_masking).forEach(field => {
        restrictedFields.add(field);
      });
    }
    
    return records.map(record => {
      const cleaned = { ...record };
      restrictedFields.forEach(field => {
        delete cleaned[field];
      });
      return cleaned;
    });
  }
  
  /**
   * Mask a field value according to a mask format
   * 
   * Supported mask formats:
   * - "****" - Replace entire value with asterisks
   * - "****-****-****-{last4}" - Show last 4 characters (for credit cards)
   * - "{first1}***" - Show first character
   * - "***@***.***" - Email masking
   */
  private maskValue(value: any, maskFormat: string): string {
    if (value === null || value === undefined) {
      return value;
    }
    
    const strValue = String(value);
    
    // Simple asterisk replacement
    if (maskFormat === '****' || maskFormat === '***') {
      return '*'.repeat(Math.min(strValue.length, 8));
    }
    
    // Last N characters pattern
    const lastNMatch = maskFormat.match(/\{last(\d+)\}/);
    if (lastNMatch) {
      const n = parseInt(lastNMatch[1], 10);
      if (strValue.length <= n) {
        return strValue; // Too short to mask
      }
      const lastChars = strValue.slice(-n);
      const masked = '*'.repeat(strValue.length - n);
      return maskFormat.replace(/\{last\d+\}/, lastChars).replace(/\*/g, () => masked[0] || '*');
    }
    
    // First N characters pattern
    const firstNMatch = maskFormat.match(/\{first(\d+)\}/);
    if (firstNMatch) {
      const n = parseInt(firstNMatch[1], 10);
      if (strValue.length <= n) {
        return strValue; // Too short to mask
      }
      const firstChars = strValue.slice(0, n);
      const masked = '*'.repeat(strValue.length - n);
      return maskFormat.replace(/\{first\d+\}/, firstChars).replace(/\*/g, () => masked[0] || '*');
    }
    
    // Email masking
    if (maskFormat.includes('@') && strValue.includes('@')) {
      const [localPart, domain] = strValue.split('@');
      const maskedLocal = localPart.length > 2 
        ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
        : localPart;
      
      const domainParts = domain.split('.');
      const maskedDomain = domainParts.map((part, i) => {
        if (i === domainParts.length - 1) {
          return part; // Keep TLD
        }
        return part.length > 2
          ? part[0] + '*'.repeat(part.length - 2) + part[part.length - 1]
          : part;
      }).join('.');
      
      return `${maskedLocal}@${maskedDomain}`;
    }
    
    // Credit card format (e.g., "****-****-****-1234")
    if (maskFormat.includes('-')) {
      const parts = maskFormat.split('-');
      const valueParts = this.splitIntoChunks(strValue, parts.length);
      
      return parts.map((part, i) => {
        if (part.includes('{last')) {
          const match = part.match(/\{last(\d+)\}/);
          if (match) {
            const n = parseInt(match[1], 10);
            return valueParts[i]?.slice(-n) || '';
          }
        }
        return '*'.repeat(valueParts[i]?.length || 4);
      }).join('-');
    }
    
    // Default: mask everything except first and last character
    if (strValue.length <= 2) {
      return '*'.repeat(strValue.length);
    }
    
    return strValue[0] + '*'.repeat(strValue.length - 2) + strValue[strValue.length - 1];
  }
  
  /**
   * Split a string into equal chunks
   */
  private splitIntoChunks(str: string, numChunks: number): string[] {
    const chunkSize = Math.ceil(str.length / numChunks);
    const chunks: string[] = [];
    
    for (let i = 0; i < str.length; i += chunkSize) {
      chunks.push(str.slice(i, i + chunkSize));
    }
    
    return chunks;
  }
  
  /**
   * Get list of fields accessible to a user for an operation
   */
  async getAccessibleFields(
    objectName: string,
    userRoles: string[],
    operation: 'read' | 'update' = 'read'
  ): Promise<string[]> {
    const config = await this.loader.load(objectName);
    
    if (!config || !config.field_permissions) {
      return []; // All fields accessible if no restrictions
    }
    
    const accessibleFields: string[] = [];
    
    for (const [fieldName, fieldPerm] of Object.entries(config.field_permissions)) {
      const allowedRoles = (fieldPerm as any)[operation];
      
      if (!allowedRoles || !Array.isArray(allowedRoles)) {
        continue;
      }
      
      const hasAccess = userRoles.some(role => allowedRoles.includes(role));
      
      if (hasAccess) {
        accessibleFields.push(fieldName);
      }
    }
    
    return accessibleFields;
  }
  
  /**
   * Check if a user can access a specific field
   */
  async canAccessField(
    objectName: string,
    fieldName: string,
    userRoles: string[],
    operation: 'read' | 'update' = 'read'
  ): Promise<boolean> {
    const config = await this.loader.load(objectName);
    
    if (!config || !config.field_permissions) {
      return true; // No restrictions
    }
    
    const fieldPerm = config.field_permissions[fieldName] as any;
    
    if (!fieldPerm) {
      return true; // No restrictions on this field
    }
    
    const allowedRoles = fieldPerm[operation];
    
    if (!allowedRoles || !Array.isArray(allowedRoles)) {
      return false; // No roles configured
    }
    
    return userRoles.some(role => allowedRoles.includes(role));
  }
}
