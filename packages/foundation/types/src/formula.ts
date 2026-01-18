/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Formula Engine Types
 * 
 * Type definitions for the ObjectQL Formula Engine.
 * Formulas are read-only calculated fields that derive values from other fields,
 * related records, or system variables using JavaScript-style expressions.
 * 
 * @see docs/spec/formula.md for complete specification
 */

import { ObjectQLError, ApiErrorCode } from './api';

/**
 * Data types that formula expressions can return
 */
export type FormulaDataType = 
    | 'number'      // Integer or decimal number
    | 'text'        // String value
    | 'date'        // Date only (YYYY-MM-DD)
    | 'datetime'    // Date and time (ISO 8601)
    | 'boolean'     // True/false
    | 'currency'    // Monetary value
    | 'percent';    // Percentage (0-100)

/**
 * Valid formula return values based on data type
 */
export type FormulaValue = 
    | number 
    | string 
    | boolean 
    | Date 
    | null 
    | undefined;

/**
 * Valid field values that can be used in formula expressions
 */
export type FormulaFieldValue = 
    | string 
    | number 
    | boolean 
    | Date 
    | null 
    | undefined 
    | FormulaFieldValue[] 
    | { [key: string]: FormulaFieldValue };

/**
 * Configuration for a formula field
 * 
 * Formula fields are defined in object metadata and evaluated at query time.
 * They are never stored in the database.
 */
export interface FormulaFieldConfig {
    /** Field type - must be 'formula' */
    type: 'formula';
    
    /** JavaScript expression to evaluate */
    expression: string;
    
    /** Expected return data type of the expression */
    data_type: FormulaDataType;
    
    /** Display label for UI */
    label?: string;
    
    /** Help text explaining the formula's purpose */
    description?: string;
    
    /** Display format for numbers/dates (e.g., "0.00", "YYYY-MM-DD") */
    format?: string;
    
    /** Decimal precision for numeric results */
    precision?: number;
    
    /** Treat blank/null as zero in calculations (default: false) */
    blank_as_zero?: boolean;
    
    /** Default value to use when referenced fields are null/undefined */
    treat_blank_as?: FormulaValue;
    
    /** AI-friendly context for understanding business intent */
    ai_context?: FormulaAiContext;
}

/**
 * AI context for formula fields
 * 
 * Provides semantic information to help AI tools understand the
 * business purpose and validation requirements of the formula.
 */
export interface FormulaAiContext {
    /** Business intent behind the formula */
    intent?: string;
    
    /** Business rule description in natural language */
    business_rule?: string;
    
    /** Algorithm description for complex formulas */
    algorithm?: string;
    
    /** Example calculations with inputs and expected results */
    examples?: FormulaExample[];
    
    /** Test cases for validation */
    test_cases?: FormulaTestCase[];
    
    /** Validation notes or constraints */
    validation_notes?: string;
    
    /** References to external documentation */
    references?: string[];
}

/**
 * Example demonstrating formula behavior
 */
export interface FormulaExample {
    /** Description of this example */
    description: string;
    
    /** Input field values */
    inputs: Record<string, FormulaFieldValue>;
    
    /** Expected result */
    result: FormulaValue;
    
    /** Optional explanation of the calculation */
    explanation?: string;
}

/**
 * Test case for formula validation
 */
export interface FormulaTestCase {
    /** Test case description */
    description?: string;
    
    /** Input values for the test */
    input: Record<string, FormulaFieldValue>;
    
    /** Expected output value */
    expected: FormulaValue;
    
    /** Whether this test should pass or fail */
    should_pass?: boolean;
}

/**
 * Runtime context for formula evaluation
 * 
 * Provides access to record data, system variables, and user context
 * during formula expression evaluation.
 */
export interface FormulaContext {
    /** Current record data with all field values */
    record: Record<string, FormulaFieldValue>;
    
    /** System date/time variables */
    system: FormulaSystemVariables;
    
    /** Current user context */
    current_user: FormulaUserContext;
    
    /** Record context flags */
    is_new: boolean;
    
    /** Record ID (if exists) */
    record_id?: string;
}

/**
 * System variables available in formula expressions
 */
export interface FormulaSystemVariables {
    /** Current date (YYYY-MM-DD) */
    today: Date;
    
    /** Current timestamp */
    now: Date;
    
    /** Current year */
    year: number;
    
    /** Current month (1-12) */
    month: number;
    
    /** Current day of month (1-31) */
    day: number;
    
    /** Current hour (0-23) */
    hour: number;
    
    /** Current minute (0-59) */
    minute?: number;
    
    /** Current second (0-59) */
    second?: number;
}

/**
 * Current user context available in formula expressions
 */
export interface FormulaUserContext {
    /** User ID */
    id: string;
    
    /** User's display name */
    name?: string;
    
    /** User's email address */
    email?: string;
    
    /** User's role */
    role?: string;
    
    /** Additional user properties */
    [key: string]: unknown;
}

/**
 * Result of formula evaluation
 */
export interface FormulaEvaluationResult {
    /** Computed value */
    value: FormulaValue;
    
    /** Data type of the result */
    type: FormulaDataType;
    
    /** Whether evaluation was successful */
    success: boolean;
    
    /** Error message if evaluation failed */
    error?: string;
    
    /** Stack trace for debugging (if error occurred) */
    stack?: string;
    
    /** Execution time in milliseconds */
    execution_time?: number;
}

/**
 * Error types that can occur during formula evaluation
 */
export enum FormulaErrorType {
    /** Syntax error in the expression */
    SYNTAX_ERROR = 'SYNTAX_ERROR',
    
    /** Referenced field does not exist */
    FIELD_NOT_FOUND = 'FIELD_NOT_FOUND',
    
    /** Type mismatch in operation */
    TYPE_ERROR = 'TYPE_ERROR',
    
    /** Division by zero */
    DIVISION_BY_ZERO = 'DIVISION_BY_ZERO',
    
    /** Null or undefined value in operation */
    NULL_REFERENCE = 'NULL_REFERENCE',
    
    /** Evaluation timeout */
    TIMEOUT = 'TIMEOUT',
    
    /** Security violation (restricted operation) */
    SECURITY_VIOLATION = 'SECURITY_VIOLATION',
    
    /** Generic runtime error */
    RUNTIME_ERROR = 'RUNTIME_ERROR',
}

/**
 * Context information for formula errors
 */
export interface FormulaErrorContext {
    /** The formula expression that caused the error */
    expression?: string;
    
    /** Field name if applicable */
    field?: string;
    
    /** Record data at time of error */
    record?: Record<string, FormulaFieldValue>;
    
    /** Additional context information */
    [key: string]: unknown;
}

/**
 * Custom error for formula evaluation failures
 * Extends ObjectQLError to maintain consistency with ObjectQL error handling
 */
export class FormulaError extends ObjectQLError {
    public readonly errorType: FormulaErrorType;
    public readonly expression?: string;
    public readonly errorContext?: FormulaErrorContext;

    constructor(
        type: FormulaErrorType,
        message: string,
        expression?: string,
        context?: FormulaErrorContext
    ) {
        super({
            code: type as string,
            message,
            details: {
                formula_error_type: type,
                expression,
                ...context
            }
        });
        this.name = 'FormulaError';
        this.errorType = type;
        this.expression = expression;
        this.errorContext = context;
    }
}

/**
 * Options for formula evaluation
 */
export interface FormulaEvaluationOptions {
    /** Maximum execution time in milliseconds (default: 1000) */
    timeout?: number;
    
    /** Enable strict mode (default: true) */
    strict?: boolean;
    
    /** Enable debug mode with detailed logging */
    debug?: boolean;
    
    /** Allow async operations (default: false) */
    allow_async?: boolean;
    
    /** Sandbox restrictions */
    sandbox?: {
        /** Allowed global variables */
        allowed_globals?: string[];
        
        /** Blocked operations/methods */
        blocked_operations?: string[];
    };
}

/**
 * Metadata about a formula field for introspection
 */
export interface FormulaMetadata {
    /** Formula field name */
    field_name: string;
    
    /** The formula expression */
    expression: string;
    
    /** Expected return type */
    data_type: FormulaDataType;
    
    /** Fields referenced in the expression */
    dependencies: string[];
    
    /** Lookup chains used (e.g., ["account.owner.name"]) */
    lookup_chains: string[];
    
    /** System variables used */
    system_variables: string[];
    
    /** Whether the formula is valid */
    is_valid: boolean;
    
    /** Validation errors if invalid */
    validation_errors?: string[];
    
    /** Estimated complexity (simple, medium, complex) */
    complexity?: 'simple' | 'medium' | 'complex';
}

/**
 * Statistics about formula execution
 */
export interface FormulaExecutionStats {
    /** Formula field name */
    field_name: string;
    
    /** Total number of evaluations */
    evaluation_count: number;
    
    /** Number of successful evaluations */
    success_count: number;
    
    /** Number of failed evaluations */
    error_count: number;
    
    /** Average execution time in milliseconds */
    avg_execution_time: number;
    
    /** Maximum execution time in milliseconds */
    max_execution_time: number;
    
    /** Minimum execution time in milliseconds */
    min_execution_time: number;
    
    /** Most common error types */
    common_errors?: Record<FormulaErrorType, number>;
}

/**
 * Type for custom formula functions
 * These functions can be registered in the formula engine for use in expressions
 */
export type FormulaCustomFunction = (...args: FormulaFieldValue[]) => FormulaValue;

/**
 * Configuration for formula engine
 */
export interface FormulaEngineConfig {
    /** Enable formula caching */
    enable_cache?: boolean;
    
    /** Cache TTL in seconds */
    cache_ttl?: number;
    
    /** Maximum formula execution time in milliseconds */
    max_execution_time?: number;
    
    /** Enable performance monitoring */
    enable_monitoring?: boolean;
    
    /** Custom function library */
    custom_functions?: Record<string, FormulaCustomFunction>;
    
    /** Sandbox configuration */
    sandbox?: {
        /** Enable sandbox mode */
        enabled?: boolean;
        
        /** Allowed global objects */
        allowed_globals?: string[];
        
        /** Blocked operations */
        blocked_operations?: string[];
    };
}
