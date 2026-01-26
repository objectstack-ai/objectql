"use strict";
/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormulaError = exports.FormulaErrorType = void 0;
/**
 * Formula Engine Types
 *
 * Type definitions for the ObjectQL Formula Engine.
 * Formulas are read-only calculated fields that derive values from other fields,
 * related records, or system variables using JavaScript-style expressions.
 *
 * @see docs/spec/formula.md for complete specification
 */
const api_1 = require("./api");
/**
 * Error types that can occur during formula evaluation
 */
var FormulaErrorType;
(function (FormulaErrorType) {
    /** Syntax error in the expression */
    FormulaErrorType["SYNTAX_ERROR"] = "SYNTAX_ERROR";
    /** Referenced field does not exist */
    FormulaErrorType["FIELD_NOT_FOUND"] = "FIELD_NOT_FOUND";
    /** Type mismatch in operation */
    FormulaErrorType["TYPE_ERROR"] = "TYPE_ERROR";
    /** Division by zero */
    FormulaErrorType["DIVISION_BY_ZERO"] = "DIVISION_BY_ZERO";
    /** Null or undefined value in operation */
    FormulaErrorType["NULL_REFERENCE"] = "NULL_REFERENCE";
    /** Evaluation timeout */
    FormulaErrorType["TIMEOUT"] = "TIMEOUT";
    /** Security violation (restricted operation) */
    FormulaErrorType["SECURITY_VIOLATION"] = "SECURITY_VIOLATION";
    /** Generic runtime error */
    FormulaErrorType["RUNTIME_ERROR"] = "RUNTIME_ERROR";
})(FormulaErrorType || (exports.FormulaErrorType = FormulaErrorType = {}));
/**
 * Custom error for formula evaluation failures
 * Extends ObjectQLError to maintain consistency with ObjectQL error handling
 */
class FormulaError extends api_1.ObjectQLError {
    constructor(type, message, expression, context) {
        super({
            code: type,
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
exports.FormulaError = FormulaError;
//# sourceMappingURL=formula.js.map