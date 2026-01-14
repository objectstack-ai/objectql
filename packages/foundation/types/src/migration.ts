import { FieldConfig } from './field';

/**
 * Represents the type of schema change operation.
 */
export type SchemaChangeType = 
    | 'field_update'
    | 'field_delete'
    | 'object_update'
    | 'object_delete';

/**
 * Base interface for all schema change instructions.
 */
export interface BaseSchemaChangeInstruction {
    /** Type of schema change operation */
    type: SchemaChangeType;
    
    /** Human-readable description of the change */
    description?: string;
    
    /** Reason for the change (for audit trail) */
    reason?: string;
    
    /** Timestamp when the change was defined (ISO 8601) */
    timestamp?: string;
    
    /** Author of the change (username or ID) */
    author?: string;
}

/**
 * Database impact assessment for a field change.
 * Describes how the change affects the underlying database schema.
 */
export interface DatabaseImpact {
    /**
     * Type of database operation required.
     * - 'alter_column': Modify column properties (type, constraints, default)
     * - 'rename_column': Rename a column
     * - 'drop_column': Remove a column
     * - 'add_column': Add a new column
     * - 'rebuild_table': Requires full table rebuild (complex changes)
     * - 'no_change': Schema-level only, no database changes
     */
    operation: 'alter_column' | 'rename_column' | 'drop_column' | 'add_column' | 'rebuild_table' | 'no_change';
    
    /**
     * Whether this change requires data migration.
     * If true, existing records must be updated.
     */
    requires_data_migration: boolean;
    
    /**
     * Whether this change may cause data loss.
     * Examples: type narrowing, dropping columns, shortening text length
     */
    may_cause_data_loss: boolean;
    
    /**
     * Estimated risk level for this change.
     * - 'low': Safe, reversible change (e.g., adding nullable field)
     * - 'medium': May affect queries or require downtime (e.g., adding index)
     * - 'high': Requires careful planning (e.g., type change with data migration)
     * - 'critical': May cause data loss or extended downtime (e.g., dropping column)
     */
    risk_level?: 'low' | 'medium' | 'high' | 'critical';
    
    /**
     * Expected downtime for this change.
     * Format: ISO 8601 duration (e.g., 'PT5M' for 5 minutes, 'PT2H' for 2 hours)
     */
    estimated_downtime?: string;
    
    /**
     * Notes about the database impact for human review.
     */
    notes?: string;
}

/**
 * Database upgrade script information.
 * Contains the generated DDL/DML statements for applying the migration.
 */
export interface UpgradeScript {
    /**
     * Target database dialect.
     * Examples: 'postgresql', 'mysql', 'sqlite', 'mongodb', 'mssql'
     */
    dialect: string;
    
    /**
     * SQL or database-specific statements to apply the change (forward migration).
     * For SQL: DDL statements (ALTER TABLE, CREATE INDEX, etc.)
     * For MongoDB: Update operations
     */
    up_statements: string[];
    
    /**
     * SQL or database-specific statements to rollback the change (reverse migration).
     * Only present if the change is reversible.
     */
    down_statements?: string[];
    
    /**
     * Pre-migration checks or validations to run before applying changes.
     * Examples: Check for data integrity, verify no duplicate values before adding UNIQUE constraint
     */
    pre_checks?: string[];
    
    /**
     * Post-migration validations to ensure the change was successful.
     * Examples: Verify column exists, check data was migrated correctly
     */
    post_checks?: string[];
    
    /**
     * Estimated execution time for this script.
     * Format: ISO 8601 duration
     */
    estimated_execution_time?: string;
}

/**
 * Instruction to update (modify) a field in an object.
 * Can rename, change type, or update properties of an existing field.
 */
export interface FieldUpdateInstruction extends BaseSchemaChangeInstruction {
    type: 'field_update';
    
    /** Name of the object containing the field */
    object_name: string;
    
    /** Current name of the field to update */
    field_name: string;
    
    /** New name for the field (if renaming) */
    new_field_name?: string;
    
    /** Updated field configuration (partial) */
    changes: Partial<FieldConfig>;
    
    /**
     * Strategy for handling existing data during type changes.
     * - 'auto': Attempt automatic conversion
     * - 'manual': Requires custom data migration script
     * - 'preserve': Keep data as-is (may cause validation errors)
     * - 'clear': Set field to null/default for all existing records
     */
    data_migration_strategy?: 'auto' | 'manual' | 'preserve' | 'clear';
    
    /**
     * Custom data transformation function (for manual strategy).
     * Should be a valid JavaScript expression or function body.
     */
    transform_script?: string;
    
    /**
     * Database impact assessment for this field change.
     * Describes the effect on the underlying database schema.
     */
    database_impact?: DatabaseImpact;
    
    /**
     * Generated upgrade scripts for different database dialects.
     * Maps dialect name to upgrade script.
     * Example: { postgresql: {...}, mysql: {...} }
     */
    upgrade_scripts?: Record<string, UpgradeScript>;
}

/**
 * Instruction to delete (remove) a field from an object.
 */
export interface FieldDeleteInstruction extends BaseSchemaChangeInstruction {
    type: 'field_delete';
    
    /** Name of the object containing the field */
    object_name: string;
    
    /** Name of the field to delete */
    field_name: string;
    
    /**
     * Strategy for handling existing data in the field.
     * - 'drop': Remove the field and its data (irreversible)
     * - 'archive': Move data to an archive/backup location
     * - 'soft': Mark as deleted but keep data (for rollback)
     */
    deletion_strategy?: 'drop' | 'archive' | 'soft';
    
    /** Backup location if using 'archive' strategy */
    archive_location?: string;
    
    /**
     * Database impact assessment for this field deletion.
     * Describes the effect on the underlying database schema.
     */
    database_impact?: DatabaseImpact;
    
    /**
     * Generated upgrade scripts for different database dialects.
     * Maps dialect name to upgrade script.
     * Example: { postgresql: {...}, mysql: {...} }
     */
    upgrade_scripts?: Record<string, UpgradeScript>;
}

/**
 * Configuration changes that can be applied to an object.
 * Used by ObjectUpdateInstruction to modify object metadata.
 */
export interface ObjectUpdateChanges {
    /** Updated human-readable label */
    label?: string;
    /** Updated icon string */
    icon?: string;
    /** Updated description */
    description?: string;
    /** Updated datasource name */
    datasource?: string;
}

/**
 * Instruction to update (modify) an object definition.
 * Can rename or change properties of an existing object.
 */
export interface ObjectUpdateInstruction extends BaseSchemaChangeInstruction {
    type: 'object_update';
    
    /** Current name of the object to update */
    object_name: string;
    
    /** New name for the object (if renaming) */
    new_object_name?: string;
    
    /** Updated properties (label, description, icon, etc.) */
    changes: ObjectUpdateChanges;
    
    /**
     * Database impact assessment for this object change.
     * Describes the effect on the underlying database schema.
     */
    database_impact?: DatabaseImpact;
    
    /**
     * Generated upgrade scripts for different database dialects.
     * Maps dialect name to upgrade script.
     * Example: { postgresql: {...}, mysql: {...} }
     */
    upgrade_scripts?: Record<string, UpgradeScript>;
}

/**
 * Instruction to delete (remove) an entire object.
 */
export interface ObjectDeleteInstruction extends BaseSchemaChangeInstruction {
    type: 'object_delete';
    
    /** Name of the object to delete */
    object_name: string;
    
    /**
     * Strategy for handling existing data in the object.
     * - 'drop': Remove the object and all its data (irreversible)
     * - 'archive': Move all data to an archive/backup location
     * - 'soft': Mark as deleted but keep data (for rollback)
     */
    deletion_strategy?: 'drop' | 'archive' | 'soft';
    
    /** Backup location if using 'archive' strategy */
    archive_location?: string;
    
    /**
     * Handle dependent objects/relationships.
     * - 'cascade': Also delete related records in other objects
     * - 'fail': Fail if there are dependent records
     * - 'nullify': Set foreign key references to null
     */
    cascade_strategy?: 'cascade' | 'fail' | 'nullify';
    
    /**
     * Database impact assessment for this object deletion.
     * Describes the effect on the underlying database schema.
     */
    database_impact?: DatabaseImpact;
    
    /**
     * Generated upgrade scripts for different database dialects.
     * Maps dialect name to upgrade script.
     * Example: { postgresql: {...}, mysql: {...} }
     */
    upgrade_scripts?: Record<string, UpgradeScript>;
}

/**
 * Union type for all schema change instructions.
 */
export type SchemaChangeInstruction = 
    | FieldUpdateInstruction
    | FieldDeleteInstruction
    | ObjectUpdateInstruction
    | ObjectDeleteInstruction;

/**
 * Represents a single migration step in a migration sequence.
 */
export interface MigrationStep {
    /** Unique identifier for this step */
    id: string;
    
    /** Human-readable name for this step */
    name: string;
    
    /** Description of what this step does */
    description?: string;
    
    /** Schema change instruction to execute */
    instruction: SchemaChangeInstruction;
    
    /**
     * Whether this step can be automatically rolled back.
     * Default: true
     */
    reversible?: boolean;
    
    /**
     * Optional rollback instruction (if different from automatic inverse).
     */
    rollback_instruction?: SchemaChangeInstruction;
    
    /**
     * Dependencies on other migration steps (by step ID).
     * This step will only execute after dependencies are complete.
     */
    depends_on?: string[];
}

/**
 * Configuration for a complete migration.
 * Groups multiple schema changes into a versioned migration.
 */
export interface MigrationConfig {
    /** Unique identifier for this migration (e.g., 'v1.0_add_user_fields') */
    id: string;
    
    /** Semantic version number (e.g., '1.2.0') */
    version: string;
    
    /** Human-readable name for this migration */
    name: string;
    
    /** Detailed description of the migration purpose */
    description?: string;
    
    /** Author of the migration */
    author?: string;
    
    /** Timestamp when the migration was created (ISO 8601) */
    created_at?: string;
    
    /** Ordered list of migration steps to execute */
    steps: MigrationStep[];
    
    /**
     * Whether this migration can be automatically rolled back.
     * Default: true if all steps are reversible
     */
    reversible?: boolean;
    
    /**
     * Dependencies on other migrations (by migration ID).
     * This migration will only run after dependencies are applied.
     */
    depends_on?: string[];
    
    /**
     * Tags for categorization and filtering.
     * Examples: ['schema', 'data', 'hotfix', 'feature']
     */
    tags?: string[];
}

/**
 * Represents the execution status of a migration.
 */
export interface MigrationStatus {
    /** Migration ID */
    migration_id: string;
    
    /** Execution status */
    status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
    
    /** Timestamp when execution started */
    started_at?: string;
    
    /** Timestamp when execution completed */
    completed_at?: string;
    
    /** Error message if failed */
    error?: string;
    
    /** Number of steps completed */
    steps_completed?: number;
    
    /** Total number of steps */
    steps_total?: number;
}
