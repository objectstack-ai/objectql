/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Validation engine for ObjectQL.
 * Executes validation rules based on metadata configuration.
 */

import {
    AnyValidationRule,
    ValidationContext,
    ValidationResult,
    ValidationRuleResult,
    CrossFieldValidationRule,
    StateMachineValidationRule,
    UniquenessValidationRule,
    BusinessRuleValidationRule,
    CustomValidationRule,
    FieldConfig,
    ObjectDoc,
    ValidationCondition,
    ValidationOperator,
} from '@objectql/types';

/**
 * Configuration options for the Validator.
 */
export interface ValidatorOptions {
    /** Preferred language for validation messages (default: 'en') */
    language?: string;
    /** Fallback languages if preferred language is not available */
    languageFallback?: string[];
}

/**
 * Validator class that executes validation rules.
 */
export class Validator {
    private options: ValidatorOptions;

    constructor(options: ValidatorOptions = {}) {
        this.options = {
            language: options.language || 'en',
            languageFallback: options.languageFallback || ['en', 'zh-CN'],
        };
    }

    /**
     * Validate a record against a set of rules.
     */
    async validate(
        rules: AnyValidationRule[],
        context: ValidationContext
    ): Promise<ValidationResult> {
        const results: ValidationRuleResult[] = [];

        for (const rule of rules) {
            // Check if rule should be applied
            if (!this.shouldApplyRule(rule, context)) {
                continue;
            }

            // Execute validation based on rule type
            let result: ValidationRuleResult;
            
            try {
                switch (rule.type) {
                    case 'cross_field':
                        result = await this.validateCrossField(rule as CrossFieldValidationRule, context);
                        break;
                    case 'state_machine':
                        result = await this.validateStateMachine(rule as StateMachineValidationRule, context);
                        break;
                    case 'unique':
                        result = await this.validateUniqueness(rule as UniquenessValidationRule, context);
                        break;
                    case 'business_rule':
                        result = await this.validateBusinessRule(rule as BusinessRuleValidationRule, context);
                        break;
                    case 'custom':
                        result = await this.validateCustom(rule as CustomValidationRule, context);
                        break;
                    default:
                        // Generic validation
                        result = {
                            rule: rule.name,
                            valid: true,
                        };
                }
            } catch (error) {
                result = {
                    rule: rule.name,
                    valid: false,
                    message: error instanceof Error ? error.message : 'Validation error',
                    severity: rule.severity || 'error',
                };
            }

            results.push(result);
        }

        // Categorize results
        const errors = results.filter(r => !r.valid && r.severity === 'error');
        const warnings = results.filter(r => !r.valid && r.severity === 'warning');
        const info = results.filter(r => !r.valid && r.severity === 'info');

        return {
            valid: errors.length === 0,
            results,
            errors,
            warnings,
            info,
        };
    }

    /**
     * Validate field-level rules.
     */
    async validateField(
        fieldName: string,
        fieldConfig: FieldConfig,
        value: any,
        context: ValidationContext
    ): Promise<ValidationRuleResult[]> {
        const results: ValidationRuleResult[] = [];

        // Required field validation
        if (fieldConfig.required && (value === null || value === undefined || value === '')) {
            results.push({
                rule: `${fieldName}_required`,
                valid: false,
                message: fieldConfig.validation?.message || `${fieldConfig.label || fieldName} is required`,
                severity: 'error',
                fields: [fieldName],
            });
        }

        // Skip further validation if value is empty and not required
        if (value === null || value === undefined || value === '') {
            return results;
        }

        // Type-specific validation
        if (fieldConfig.validation) {
            const validation = fieldConfig.validation;

            // Email format
            if (validation.format === 'email') {
                // NOTE: This is a basic email validation regex. For production use,
                // consider using a more comprehensive email validation library or regex
                // that handles international domains, quoted strings, etc.
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    results.push({
                        rule: `${fieldName}_email_format`,
                        valid: false,
                        message: validation.message || 'Invalid email format',
                        severity: 'error',
                        fields: [fieldName],
                    });
                }
            }

            // URL format
            if (validation.format === 'url') {
                try {
                    const url = new URL(value);
                    if (validation.protocols && !validation.protocols.includes(url.protocol.replace(':', ''))) {
                        results.push({
                            rule: `${fieldName}_url_protocol`,
                            valid: false,
                            message: validation.message || `URL must use one of: ${validation.protocols.join(', ')}`,
                            severity: 'error',
                            fields: [fieldName],
                        });
                    }
                } catch {
                    results.push({
                        rule: `${fieldName}_url_format`,
                        valid: false,
                        message: validation.message || 'Invalid URL format',
                        severity: 'error',
                        fields: [fieldName],
                    });
                }
            }

            // Pattern validation (supports both pattern and deprecated regex)
            const patternValue = validation.pattern ?? validation.regex;
            if (patternValue) {
                try {
                    const pattern = new RegExp(patternValue);
                    if (!pattern.test(String(value))) {
                        results.push({
                            rule: `${fieldName}_pattern`,
                            valid: false,
                            message: validation.message || 'Value does not match required pattern',
                            severity: 'error',
                            fields: [fieldName],
                        });
                    }
                } catch (error) {
                    results.push({
                        rule: `${fieldName}_pattern`,
                        valid: false,
                        message: `Invalid regex pattern: ${patternValue}`,
                        severity: 'error',
                        fields: [fieldName],
                    });
                }
            }

            // Min/Max validation
            if (validation.min !== undefined && value < validation.min) {
                results.push({
                    rule: `${fieldName}_min`,
                    valid: false,
                    message: validation.message || `Value must be at least ${validation.min}`,
                    severity: 'error',
                    fields: [fieldName],
                });
            }

            if (validation.max !== undefined && value > validation.max) {
                results.push({
                    rule: `${fieldName}_max`,
                    valid: false,
                    message: validation.message || `Value must be at most ${validation.max}`,
                    severity: 'error',
                    fields: [fieldName],
                });
            }

            // Length validation
            const strValue = String(value);
            if (validation.min_length !== undefined && strValue.length < validation.min_length) {
                results.push({
                    rule: `${fieldName}_min_length`,
                    valid: false,
                    message: validation.message || `Must be at least ${validation.min_length} characters`,
                    severity: 'error',
                    fields: [fieldName],
                });
            }

            if (validation.max_length !== undefined && strValue.length > validation.max_length) {
                results.push({
                    rule: `${fieldName}_max_length`,
                    valid: false,
                    message: validation.message || `Must be at most ${validation.max_length} characters`,
                    severity: 'error',
                    fields: [fieldName],
                });
            }
        }

        // Legacy min/max from fieldConfig
        if (fieldConfig.min !== undefined && value < fieldConfig.min) {
            results.push({
                rule: `${fieldName}_min`,
                valid: false,
                message: `Value must be at least ${fieldConfig.min}`,
                severity: 'error',
                fields: [fieldName],
            });
        }

        if (fieldConfig.max !== undefined && value > fieldConfig.max) {
            results.push({
                rule: `${fieldName}_max`,
                valid: false,
                message: `Value must be at most ${fieldConfig.max}`,
                severity: 'error',
                fields: [fieldName],
            });
        }

        return results;
    }

    /**
     * Check if a rule should be applied based on triggers and conditions.
     */
    private shouldApplyRule(rule: AnyValidationRule, context: ValidationContext): boolean {
        // Check trigger
        if (rule.trigger && !rule.trigger.includes(context.operation)) {
            return false;
        }

        // Check fields (for updates)
        if (rule.fields && rule.fields.length > 0 && context.changedFields) {
            const hasChangedField = rule.fields.some(f => context.changedFields!.includes(f));
            if (!hasChangedField) {
                return false;
            }
        }

        // Check apply_when condition
        if (rule.apply_when) {
            return this.evaluateCondition(rule.apply_when, context.record);
        }

        return true;
    }

    /**
     * Validate cross-field rule.
     */
    private async validateCrossField(
        rule: CrossFieldValidationRule,
        context: ValidationContext
    ): Promise<ValidationRuleResult> {
        if (!rule.rule) {
            return { rule: rule.name, valid: true };
        }

        const valid = this.evaluateCondition(rule.rule, context.record);

        return {
            rule: rule.name,
            valid,
            message: valid ? undefined : this.formatMessage(rule.message, context.record),
            error_code: rule.error_code,
            severity: rule.severity || 'error',
        };
    }

    /**
     * Validate state machine transitions.
     */
    private async validateStateMachine(
        rule: StateMachineValidationRule,
        context: ValidationContext
    ): Promise<ValidationRuleResult> {
        // Only validate on update
        if (context.operation !== 'update' || !context.previousRecord) {
            return { rule: rule.name, valid: true };
        }

        const oldState = context.previousRecord[rule.field];
        const newState = context.record[rule.field];

        // If state hasn't changed, validation passes
        if (oldState === newState) {
            return { rule: rule.name, valid: true };
        }

        // Check if transition is allowed
        const transitions = rule.transitions?.[oldState];
        if (!transitions) {
            return {
                rule: rule.name,
                valid: false,
                message: this.formatMessage(rule.message, { old_status: oldState, new_status: newState }),
                error_code: rule.error_code,
                severity: rule.severity || 'error',
                fields: [rule.field],
            };
        }

        // Handle both array and object format
        let allowedNext: string[] = [];
        if (Array.isArray(transitions)) {
            allowedNext = transitions;
        } else if (typeof transitions === 'object' && 'allowed_next' in transitions) {
            allowedNext = transitions.allowed_next || [];
        }

        const isAllowed = allowedNext.includes(newState);

        return {
            rule: rule.name,
            valid: isAllowed,
            message: isAllowed ? undefined : this.formatMessage(rule.message, { old_status: oldState, new_status: newState }),
            error_code: rule.error_code,
            severity: rule.severity || 'error',
            fields: [rule.field],
        };
    }

    /**
     * Validate uniqueness by checking database for existing values.
     */
    private async validateUniqueness(
        rule: UniquenessValidationRule,
        context: ValidationContext
    ): Promise<ValidationRuleResult> {
        // Check if API is available for database access
        if (!context.api) {
            // If no API provided, we can't validate - pass by default
            return {
                rule: rule.name,
                valid: true,
            };
        }

        // Get object name from context metadata
        if (!context.metadata?.objectName) {
            return {
                rule: rule.name,
                valid: false,
                message: 'Object name not provided in validation context',
                severity: rule.severity || 'error',
            };
        }

        const objectName = context.metadata.objectName;

        // Determine fields to check for uniqueness
        const fieldsToCheck: string[] = rule.fields || (rule.field ? [rule.field] : []);
        
        if (fieldsToCheck.length === 0) {
            return {
                rule: rule.name,
                valid: false,
                message: 'No fields specified for uniqueness validation',
                severity: rule.severity || 'error',
            };
        }

        // Build query filter
        const filters: Record<string, any> = {};

        // Add field conditions
        for (const field of fieldsToCheck) {
            const fieldValue = context.record[field];
            
            // Skip validation if field value is null/undefined (no value to check uniqueness for)
            if (fieldValue === null || fieldValue === undefined) {
                return {
                    rule: rule.name,
                    valid: true,
                };
            }

            // Handle case sensitivity for string values
            if (typeof fieldValue === 'string' && rule.case_sensitive === false) {
                // NOTE: Case-insensitive comparison requires driver-specific implementation
                // Some drivers support regex (MongoDB), others use LOWER() function (SQL)
                // For now, we use exact match - driver adapters should implement case-insensitive logic
                filters[field] = fieldValue;
            } else {
                filters[field] = fieldValue;
            }
        }

        // Apply scope conditions if specified
        if (rule.scope) {
            // Evaluate scope condition and add to filters
            const scopeFields = this.extractFieldsFromCondition(rule.scope);
            for (const field of scopeFields) {
                if (context.record[field] !== undefined) {
                    filters[field] = context.record[field];
                }
            }
        }

        // Exclude current record for update operations
        if (context.operation === 'update' && context.previousRecord?._id) {
            filters._id = { $ne: context.previousRecord._id };
        }

        try {
            // Query database to count existing records with same field values
            const count = await context.api.count(objectName, filters);

            const valid = count === 0;

            return {
                rule: rule.name,
                valid,
                message: valid ? undefined : this.formatMessage(rule.message, context.record),
                error_code: rule.error_code,
                severity: rule.severity || 'error',
                fields: fieldsToCheck,
            };
        } catch (error) {
            // If query fails, treat as validation error
            return {
                rule: rule.name,
                valid: false,
                message: `Uniqueness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                severity: rule.severity || 'error',
                fields: fieldsToCheck,
            };
        }
    }

    /**
     * Extract field names from a validation condition.
     */
    private extractFieldsFromCondition(condition: ValidationCondition): string[] {
        const fields: string[] = [];
        
        if (condition.field) {
            fields.push(condition.field);
        }
        
        if (condition.all_of) {
            for (const subcondition of condition.all_of) {
                fields.push(...this.extractFieldsFromCondition(subcondition));
            }
        }
        
        if (condition.any_of) {
            for (const subcondition of condition.any_of) {
                fields.push(...this.extractFieldsFromCondition(subcondition));
            }
        }
        
        return fields;
    }

    /**
     * Validate business rule by evaluating constraint conditions.
     */
    private async validateBusinessRule(
        rule: BusinessRuleValidationRule,
        context: ValidationContext
    ): Promise<ValidationRuleResult> {
        if (!rule.constraint) {
            // No constraint specified, validation passes
            return {
                rule: rule.name,
                valid: true,
            };
        }

        const constraint = rule.constraint;
        let valid = true;

        // Evaluate all_of conditions (all must be true)
        if (constraint.all_of && constraint.all_of.length > 0) {
            valid = constraint.all_of.every(condition => this.evaluateCondition(condition, context.record));
            
            if (!valid) {
                return {
                    rule: rule.name,
                    valid: false,
                    message: this.formatMessage(rule.message, context.record),
                    error_code: rule.error_code,
                    severity: rule.severity || 'error',
                };
            }
        }

        // Evaluate any_of conditions (at least one must be true)
        if (constraint.any_of && constraint.any_of.length > 0) {
            valid = constraint.any_of.some(condition => this.evaluateCondition(condition, context.record));
            
            if (!valid) {
                return {
                    rule: rule.name,
                    valid: false,
                    message: this.formatMessage(rule.message, context.record),
                    error_code: rule.error_code,
                    severity: rule.severity || 'error',
                };
            }
        }

        // Evaluate expression if provided (basic implementation)
        if (constraint.expression) {
            // For now, we'll treat expression validation as a stub
            // Full implementation would require safe expression evaluation
            // This could be extended to use a safe expression evaluator in the future
            valid = true;
        }

        // Evaluate then_require conditions (conditional required fields)
        if (constraint.then_require && constraint.then_require.length > 0) {
            for (const condition of constraint.then_require) {
                const conditionMet = this.evaluateCondition(condition, context.record);
                
                if (!conditionMet) {
                    return {
                        rule: rule.name,
                        valid: false,
                        message: this.formatMessage(rule.message, context.record),
                        error_code: rule.error_code,
                        severity: rule.severity || 'error',
                    };
                }
            }
        }

        return {
            rule: rule.name,
            valid,
            message: valid ? undefined : this.formatMessage(rule.message, context.record),
            error_code: rule.error_code,
            severity: rule.severity || 'error',
        };
    }

    /**
     * Validate custom rule (stub - requires function execution).
     */
    private async validateCustom(
        rule: CustomValidationRule,
        context: ValidationContext
    ): Promise<ValidationRuleResult> {
        // TODO: Implement custom validator execution
        // This requires safe function evaluation
        // Stub: Pass silently until implementation is complete
        return {
            rule: rule.name,
            valid: true,
        };
    }

    /**
     * Evaluate a validation condition.
     */
    private evaluateCondition(condition: ValidationCondition, record: ObjectDoc): boolean {
        // Handle logical operators
        if (condition.all_of) {
            return condition.all_of.every(c => this.evaluateCondition(c, record));
        }

        if (condition.any_of) {
            return condition.any_of.some(c => this.evaluateCondition(c, record));
        }

        // Handle expression
        if (condition.expression) {
            // TODO: Implement safe expression evaluation
            return true;
        }

        // Handle field comparison
        if (condition.field && condition.operator !== undefined) {
            const fieldValue = record[condition.field];
            // Use compare_to if specified (cross-field comparison), otherwise use value
            const compareValue = condition.compare_to !== undefined 
                ? record[condition.compare_to] 
                : condition.value;
            return this.compareValues(fieldValue, condition.operator, compareValue);
        }

        return true;
    }

    /**
     * Compare two values using an operator.
     */
    private compareValues(a: any, operator: ValidationOperator, b: any): boolean {
        switch (operator) {
            case '=':
                return a === b;
            case '!=':
                return a !== b;
            case '>':
                return a > b;
            case '>=':
                return a >= b;
            case '<':
                return a < b;
            case '<=':
                return a <= b;
            case 'in':
                return Array.isArray(b) && b.includes(a);
            case 'not_in':
                return Array.isArray(b) && !b.includes(a);
            case 'contains': {
                if (a == null || b == null) {
                    return false;
                }
                const strA = String(a);
                const strB = String(b);
                return strA.includes(strB);
            }
            case 'not_contains': {
                if (a == null || b == null) {
                    return false;
                }
                const strA = String(a);
                const strB = String(b);
                return !strA.includes(strB);
            }
            case 'starts_with': {
                if (a == null || b == null) {
                    return false;
                }
                const strA = String(a);
                const strB = String(b);
                return strA.startsWith(strB);
            }
            case 'ends_with': {
                if (a == null || b == null) {
                    return false;
                }
                const strA = String(a);
                const strB = String(b);
                return strA.endsWith(strB);
            }
            default:
                return false;
        }
    }

    /**
     * Format validation message with template variables.
     */
    private formatMessage(message: string | Record<string, string>, context: any): string {
        // Handle i18n messages
        if (typeof message === 'object') {
            // Try preferred language first
            const preferredLanguage = this.options.language ?? 'en';
            let messageText = message[preferredLanguage];
            
            // Try fallback languages if preferred not available
            if (!messageText && this.options.languageFallback) {
                for (const lang of this.options.languageFallback) {
                    if (message[lang]) {
                        messageText = message[lang];
                        break;
                    }
                }
            }
            
            // Fallback to first available message
            message = messageText || Object.values(message)[0];
        }

        // Replace template variables
        return message.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
            const value = this.getNestedValue(context, path);
            return value !== undefined ? String(value) : match;
        });
    }

    /**
     * Get nested value from object by path.
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}
