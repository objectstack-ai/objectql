/**
 * Example: Schema Migration with ObjectQL
 * 
 * This example demonstrates how to define schema evolution instructions
 * for objects and fields using the ObjectQL migration types.
 * 
 * These migration instructions express declarative schema changes that
 * can be interpreted by migration tools or AI agents to safely evolve
 * your data model over time.
 * 
 * Note: This example uses a relative import path for demonstration purposes
 * within the monorepo. In your application, import from the package:
 * 
 * ```typescript
 * import { MigrationConfig, ... } from '@objectql/types';
 * ```
 */

import {
    MigrationConfig,
    FieldUpdateInstruction,
    FieldDeleteInstruction,
    ObjectUpdateInstruction,
    ObjectDeleteInstruction,
    SchemaChangeInstruction
} from '../packages/foundation/types/src/index';

// ========================================
// Example 1: Field Rename Migration
// ========================================

const renameFieldMigration: MigrationConfig = {
    id: 'v1.1_rename_username',
    version: '1.1.0',
    name: 'Rename Username Field',
    description: 'Rename username to user_name for consistency across objects',
    author: 'dev-team',
    created_at: '2026-01-14T00:00:00Z',
    steps: [
        {
            id: 'step_1',
            name: 'Rename username field in users object',
            description: 'Update field name from username to user_name',
            instruction: {
                type: 'field_update',
                object_name: 'users',
                field_name: 'username',
                new_field_name: 'user_name',
                changes: {
                    label: 'User Name'
                },
                data_migration_strategy: 'auto',
                description: 'Rename for naming consistency',
                reason: 'Align with naming conventions across all objects'
            } as FieldUpdateInstruction,
            reversible: true
        }
    ],
    reversible: true,
    tags: ['refactor', 'naming']
};

// ========================================
// Example 2: Field Type Change Migration
// ========================================

const changeFieldTypeMigration: MigrationConfig = {
    id: 'v1.2_convert_price_to_currency',
    version: '1.2.0',
    name: 'Convert Price to Currency Type',
    description: 'Change price field from number to currency type for better formatting',
    author: 'product-team',
    created_at: '2026-01-15T00:00:00Z',
    steps: [
        {
            id: 'step_1',
            name: 'Convert product price field',
            instruction: {
                type: 'field_update',
                object_name: 'products',
                field_name: 'price',
                changes: {
                    type: 'currency',
                    label: 'Price (USD)',
                    defaultValue: 0
                },
                data_migration_strategy: 'manual',
                transform_script: `
                    // Custom transformation for existing records
                    function transform(oldValue) {
                        if (typeof oldValue === 'number') {
                            return oldValue;
                        }
                        return 0;
                    }
                `,
                description: 'Convert from number to currency type',
                reason: 'Support proper currency formatting and calculations'
            } as FieldUpdateInstruction,
            reversible: false,  // Type changes are typically not auto-reversible
            depends_on: []
        }
    ],
    reversible: false,
    tags: ['schema', 'type-change']
};

// ========================================
// Example 3: Remove Deprecated Fields
// ========================================

const removeDeprecatedFieldsMigration: MigrationConfig = {
    id: 'v2.0_cleanup_legacy_fields',
    version: '2.0.0',
    name: 'Remove Legacy Fields',
    description: 'Clean up deprecated fields that are no longer used',
    author: 'dev-team',
    created_at: '2026-02-01T00:00:00Z',
    steps: [
        {
            id: 'step_1',
            name: 'Remove legacy_id from users',
            instruction: {
                type: 'field_delete',
                object_name: 'users',
                field_name: 'legacy_id',
                deletion_strategy: 'archive',
                archive_location: 'backups/users_legacy_id',
                description: 'Remove deprecated legacy_id field',
                reason: 'Field no longer needed after migration to new ID system'
            } as FieldDeleteInstruction,
            reversible: true
        },
        {
            id: 'step_2',
            name: 'Remove old_status from projects',
            instruction: {
                type: 'field_delete',
                object_name: 'projects',
                field_name: 'old_status',
                deletion_strategy: 'soft',
                description: 'Remove deprecated status field',
                reason: 'Replaced by new status state machine'
            } as FieldDeleteInstruction,
            reversible: true,
            depends_on: ['step_1']
        }
    ],
    reversible: true,
    tags: ['cleanup', 'deprecated']
};

// ========================================
// Example 4: Object Rename Migration
// ========================================

const renameObjectMigration: MigrationConfig = {
    id: 'v1.3_rename_customer_to_account',
    version: '1.3.0',
    name: 'Rename Customer to Account',
    description: 'Rename customer object to account for CRM consistency',
    author: 'product-team',
    created_at: '2026-01-20T00:00:00Z',
    steps: [
        {
            id: 'step_1',
            name: 'Rename customer object',
            instruction: {
                type: 'object_update',
                object_name: 'customers',
                new_object_name: 'accounts',
                changes: {
                    label: 'Account',
                    description: 'Business accounts and customers',
                    icon: 'standard:account'
                },
                description: 'Rename object for CRM terminology',
                reason: 'Align with standard CRM naming (Salesforce-like)'
            } as ObjectUpdateInstruction,
            reversible: true
        }
    ],
    reversible: true,
    tags: ['refactor', 'crm']
};

// ========================================
// Example 5: Remove Temporary Object
// ========================================

const removeTempObjectMigration: MigrationConfig = {
    id: 'v1.5_remove_temp_imports',
    version: '1.5.0',
    name: 'Remove Temporary Import Table',
    description: 'Clean up temporary import table after migration',
    author: 'dev-team',
    created_at: '2026-01-25T00:00:00Z',
    steps: [
        {
            id: 'step_1',
            name: 'Delete temp_imports object',
            instruction: {
                type: 'object_delete',
                object_name: 'temp_imports',
                deletion_strategy: 'archive',
                archive_location: 'backups/temp_imports_archive',
                cascade_strategy: 'nullify',
                description: 'Remove temporary import staging table',
                reason: 'Completed migration to new import system'
            } as ObjectDeleteInstruction,
            reversible: true
        }
    ],
    reversible: true,
    tags: ['cleanup', 'temporary']
};

// ========================================
// Example 6: Complex Multi-Step Migration
// ========================================

const complexMigration: MigrationConfig = {
    id: 'v2.1_refactor_user_profile',
    version: '2.1.0',
    name: 'Refactor User Profile Structure',
    description: 'Comprehensive update to user profile data model',
    author: 'dev-team',
    created_at: '2026-03-01T00:00:00Z',
    steps: [
        {
            id: 'step_1',
            name: 'Add new bio field',
            instruction: {
                type: 'field_update',
                object_name: 'users',
                field_name: 'bio',
                changes: {
                    type: 'textarea',
                    label: 'Biography',
                    max_length: 500
                },
                data_migration_strategy: 'clear'
            } as FieldUpdateInstruction,
            reversible: true
        },
        {
            id: 'step_2',
            name: 'Make email unique and required',
            instruction: {
                type: 'field_update',
                object_name: 'users',
                field_name: 'email',
                changes: {
                    required: true,
                    unique: true
                },
                data_migration_strategy: 'auto'
            } as FieldUpdateInstruction,
            reversible: true,
            depends_on: ['step_1']
        },
        {
            id: 'step_3',
            name: 'Remove deprecated nickname field',
            instruction: {
                type: 'field_delete',
                object_name: 'users',
                field_name: 'nickname',
                deletion_strategy: 'archive',
                archive_location: 'backups/users_nickname'
            } as FieldDeleteInstruction,
            reversible: true,
            depends_on: ['step_1', 'step_2']
        },
        {
            id: 'step_4',
            name: 'Update user object metadata',
            instruction: {
                type: 'object_update',
                object_name: 'users',
                changes: {
                    label: 'System User',
                    description: 'Registered system users with profiles'
                }
            } as ObjectUpdateInstruction,
            reversible: true,
            depends_on: ['step_3']
        }
    ],
    reversible: true,
    depends_on: ['v2.0_cleanup_legacy_fields'],
    tags: ['schema', 'refactor', 'major']
};

// ========================================
// Example 7: Migration File Format (YAML)
// ========================================

/**
 * Migrations can also be defined in YAML format for AI-friendliness.
 * File naming convention: <migration_id>.migration.yml
 * 
 * Example: v1.1_rename_username.migration.yml
 * 
 * ```yaml
 * id: v1.1_rename_username
 * version: 1.1.0
 * name: Rename Username Field
 * description: Rename username to user_name for consistency
 * author: dev-team
 * created_at: 2026-01-14T00:00:00Z
 * 
 * steps:
 *   - id: step_1
 *     name: Rename username field
 *     instruction:
 *       type: field_update
 *       object_name: users
 *       field_name: username
 *       new_field_name: user_name
 *       changes:
 *         label: User Name
 *       data_migration_strategy: auto
 *     reversible: true
 * 
 * reversible: true
 * tags:
 *   - refactor
 *   - naming
 * ```
 */

// ========================================
// Usage Example
// ========================================

export function demonstrateMigrationUsage() {
    console.log('Migration Examples for ObjectQL');
    console.log('================================\n');
    
    console.log('1. Field Rename Migration:');
    console.log(JSON.stringify(renameFieldMigration, null, 2));
    console.log('\n');
    
    console.log('2. Field Type Change Migration:');
    console.log(JSON.stringify(changeFieldTypeMigration, null, 2));
    console.log('\n');
    
    console.log('3. Remove Deprecated Fields:');
    console.log(JSON.stringify(removeDeprecatedFieldsMigration, null, 2));
    console.log('\n');
    
    console.log('4. Object Rename Migration:');
    console.log(JSON.stringify(renameObjectMigration, null, 2));
    console.log('\n');
    
    console.log('5. Remove Temporary Object:');
    console.log(JSON.stringify(removeTempObjectMigration, null, 2));
    console.log('\n');
    
    console.log('6. Complex Multi-Step Migration:');
    console.log(JSON.stringify(complexMigration, null, 2));
}

// Export all examples
export {
    renameFieldMigration,
    changeFieldTypeMigration,
    removeDeprecatedFieldsMigration,
    renameObjectMigration,
    removeTempObjectMigration,
    complexMigration
};
