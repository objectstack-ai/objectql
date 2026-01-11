/**
 * Validation system types based on the validation metadata specification.
 * These types define the structure for metadata-driven validation rules.
 */

import { ObjectDoc } from './object';

/**
 * Types of validation rules supported by ObjectQL.
 */
export type ValidationRuleType = 
    | 'field'           // Built-in field validation
    | 'cross_field'     // Validate relationships between fields
    | 'business_rule'   // Declarative business rules
    | 'state_machine'   // Enforce valid state transitions
    | 'unique'          // Uniqueness validation
    | 'dependency'      // Validate related record constraints
    | 'custom';         // Custom validation logic

/**
 * Severity levels for validation errors.
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Operations that can trigger validation.
 */
export type ValidationTrigger = 'create' | 'update' | 'delete';

/**
 * Comparison operators for validation rules.
 */
export type ValidationOperator = 
    | '=' | '!=' 
    | '>' | '>=' | '<' | '<='
    | 'in' | 'not_in'
    | 'contains' | 'not_contains'
    | 'starts_with' | 'ends_with';

/**
 * AI context for validation rules.
 * Provides semantic information for AI tools to understand validation intent.
 */
export interface ValidationAiContext {
    /** Business intent behind the validation rule */
    intent?: string;
    /** Business rule description in natural language */
    business_rule?: string;
    /** Impact level if validation fails */
    error_impact?: 'high' | 'medium' | 'low';
    /** External dependencies required for validation */
    data_dependency?: string;
    /** External system dependencies */
    external_dependency?: string;
    /** Examples of valid/invalid data */
    examples?: {
        valid?: any[];
        invalid?: any[];
    };
    /** Algorithm description for complex validation */
    algorithm?: string;
    /** Visualization of the validation logic */
    visualization?: string;
    /** Rationale for the rule */
    rationale?: string;
    /** Decision logic in natural language */
    decision_logic?: string;
    /** Compliance requirements */
    compliance?: string;
}

/**
 * Condition for applying validation rules.
 */
export interface ValidationCondition {
    /** Field to check */
    field?: string;
    /** Comparison operator */
    operator?: ValidationOperator;
    /** Value to compare against */
    value?: any;
    /** Field name to compare against (for cross-field validation) */
    compare_to?: string;
    /** Expression to evaluate */
    expression?: string;
    /** Logical AND conditions */
    all_of?: ValidationCondition[];
    /** Logical OR conditions */
    any_of?: ValidationCondition[];
}

/**
 * State transition definition for state machine validation.
 */
export interface StateTransition {
    /** States that can transition to this state */
    allowed_next?: string[];
    /** Whether this is a terminal state */
    is_terminal?: boolean;
    /** AI context for the transition */
    ai_context?: ValidationAiContext;
}

/**
 * Relationship lookup for business rule validation.
 */
export interface ValidationRelationship {
    /** Related object name */
    object?: string;
    /** Field that links to the related object */
    via?: string;
    /** Field(s) to fetch from related object */
    field?: string;
    fields?: string[];
    /** Validation to apply on related record */
    validate?: ValidationCondition;
}

/**
 * Business rule constraint definition.
 */
export interface BusinessRuleConstraint {
    /** Expression to evaluate */
    expression?: string;
    /** Relationships needed for the rule */
    relationships?: Record<string, ValidationRelationship>;
    /** Logical AND conditions */
    all_of?: ValidationCondition[];
    /** Logical OR conditions */
    any_of?: ValidationCondition[];
    /** Required field condition */
    then_require?: ValidationCondition[];
}

/**
 * Field validation configuration (built into FieldConfig).
 */
export interface FieldValidation {
    /** Format validation (email, url, etc.) */
    format?: 'email' | 'url' | 'phone' | 'date' | 'datetime';
    /** Allowed protocols for URL validation */
    protocols?: string[];
    /** Minimum value for numbers */
    min?: number;
    /** Maximum value for numbers */
    max?: number;
    /** Minimum length for strings */
    min_length?: number;
    /** Maximum length for strings */
    max_length?: number;
    /** Regular expression pattern for validation */
    pattern?: string;
    /** @deprecated Use pattern instead */
    regex?: string;
    /** Custom validation message */
    message?: string;
}

/**
 * Base validation rule definition.
 */
export interface ValidationRule {
    /** Unique name of the rule */
    name: string;
    /** Type of validation rule */
    type: ValidationRuleType;
    /** Human-readable error message */
    message: string | Record<string, string>;
    /** Error code for programmatic handling */
    error_code?: string;
    /** Severity level */
    severity?: ValidationSeverity;
    /** Operations that trigger this rule */
    trigger?: ValidationTrigger[];
    /** Fields that trigger this rule when changed */
    fields?: string[];
    /** Contexts where this rule applies */
    context?: string[];
    /** Skip in bulk operations */
    skip_bulk?: boolean;
    /** AI context for understanding the rule */
    ai_context?: ValidationAiContext;
    /** Condition for applying the rule */
    apply_when?: ValidationCondition;
    /** Whether this is an async validation */
    async?: boolean;
    /** Timeout for async validation (ms) */
    timeout?: number;
}

/**
 * Cross-field validation rule.
 */
export interface CrossFieldValidationRule extends ValidationRule {
    type: 'cross_field';
    /** The validation rule to apply */
    rule?: ValidationCondition;
}

/**
 * Business rule validation.
 */
export interface BusinessRuleValidationRule extends ValidationRule {
    type: 'business_rule';
    /** The business rule constraint */
    constraint?: BusinessRuleConstraint;
}

/**
 * State machine validation rule.
 */
export interface StateMachineValidationRule extends ValidationRule {
    type: 'state_machine';
    /** Field containing the state */
    field: string;
    /** Valid state transitions */
    transitions?: Record<string, StateTransition | string[]>;
    /** Initial states */
    initial_states?: string[];
    /** Transition conditions */
    transition_conditions?: Record<string, any>;
}

/**
 * Uniqueness validation rule.
 */
export interface UniquenessValidationRule extends ValidationRule {
    type: 'unique';
    /** Field to check for uniqueness */
    field?: string;
    /** Multiple fields for composite uniqueness */
    fields?: string[];
    /** Case sensitivity for string comparison */
    case_sensitive?: boolean;
    /** Scope constraint for conditional uniqueness */
    scope?: ValidationCondition;
}

/**
 * Dependency validation rule.
 */
export interface DependencyValidationRule extends ValidationRule {
    type: 'dependency';
    /** Validation condition */
    condition?: {
        /** Lookup validation */
        lookup?: ValidationRelationship;
        /** Related records check */
        has_related?: {
            object: string;
            relation_field: string;
            filter?: ValidationCondition[];
        };
    };
}

/**
 * Custom validation rule with validator function.
 */
export interface CustomValidationRule extends ValidationRule {
    type: 'custom';
    /** Validator function as string */
    validator?: string;
    /** Error message template */
    error_message_template?: string;
    /** Message parameters */
    message_params?: Record<string, any>;
}

/**
 * Union type for all validation rules.
 */
export type AnyValidationRule = 
    | ValidationRule
    | CrossFieldValidationRule 
    | BusinessRuleValidationRule
    | StateMachineValidationRule
    | UniquenessValidationRule
    | DependencyValidationRule
    | CustomValidationRule;

/**
 * Validation group definition.
 */
export interface ValidationGroup {
    /** Group name */
    name: string;
    /** Group description */
    description?: string;
    /** Rules in this group */
    rules: string[];
    /** Whether group runs asynchronously */
    async?: boolean;
    /** Whether this group is required */
    required?: boolean;
}

/**
 * Complete validation configuration for an object.
 */
export interface ValidationConfig {
    /** Name of the validation configuration */
    name: string;
    /** Object this validation applies to */
    object: string;
    /** Description */
    description?: string;
    /** AI context for the overall validation strategy */
    ai_context?: ValidationAiContext;
    /** Validation rules */
    rules: AnyValidationRule[];
    /** Validation groups */
    validation_groups?: ValidationGroup[];
}

/**
 * Context provided to validation functions.
 */
export interface ValidationContext {
    /** Current record data */
    record: ObjectDoc;
    /** Previous record data (for updates) */
    previousRecord?: ObjectDoc;
    /** Current user */
    user?: any;
    /** API access for queries */
    api?: any;
    /** HTTP client for external calls */
    http?: any;
    /** Operation type */
    operation: ValidationTrigger;
    /** Additional metadata */
    metadata?: {
        objectName: string;
        ruleName: string;
        [key: string]: any;
    };
    /** Changed fields (for updates) */
    changedFields?: string[];
}

/**
 * Result of a single validation rule.
 */
export interface ValidationRuleResult {
    /** Rule name */
    rule: string;
    /** Whether validation passed */
    valid: boolean;
    /** Error message if validation failed */
    message?: string;
    /** Error code */
    error_code?: string;
    /** Severity level */
    severity?: ValidationSeverity;
    /** Field(s) that failed validation */
    fields?: string[];
    /** Additional context */
    context?: any;
}

/**
 * Overall validation result for a record.
 */
export interface ValidationResult {
    /** Whether all validations passed */
    valid: boolean;
    /** Individual rule results */
    results: ValidationRuleResult[];
    /** Errors (severity: error) */
    errors: ValidationRuleResult[];
    /** Warnings (severity: warning) */
    warnings: ValidationRuleResult[];
    /** Info messages (severity: info) */
    info: ValidationRuleResult[];
}

/**
 * Validation error class.
 */
export class ValidationError extends Error {
    constructor(
        message: string,
        public results: ValidationRuleResult[],
        public code?: string
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}
