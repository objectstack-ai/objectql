/**
 * Error Handling Utilities for Drivers
 * 
 * Provides standard error handling and error creation
 */

/**
 * Base driver error class
 */
export class DriverError extends Error {
    public readonly code: string;
    public readonly details?: any;
    
    constructor(params: { code: string; message: string; details?: any }) {
        super(params.message);
        this.code = params.code;
        this.details = params.details;
        this.name = 'DriverError';
        
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DriverError);
        }
    }
}

/**
 * Standard error codes for drivers
 */
export const DriverErrorCodes = {
    RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
    DUPLICATE_RECORD: 'DUPLICATE_RECORD',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    CONNECTION_ERROR: 'CONNECTION_ERROR',
    TRANSACTION_ERROR: 'TRANSACTION_ERROR',
    QUERY_ERROR: 'QUERY_ERROR',
    INVALID_QUERY: 'INVALID_QUERY',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    DRIVER_ERROR: 'DRIVER_ERROR'
} as const;

export type DriverErrorCode = typeof DriverErrorCodes[keyof typeof DriverErrorCodes];

/**
 * Create a standard error for record not found
 * 
 * @param objectName - Name of the object
 * @param id - ID of the record
 * @returns DriverError instance
 */
export function createRecordNotFoundError(objectName: string, id: string | number): DriverError {
    return new DriverError({
        code: DriverErrorCodes.RECORD_NOT_FOUND,
        message: `Record with id '${id}' not found in '${objectName}'`,
        details: { objectName, id }
    });
}

/**
 * Create a standard error for duplicate record
 * 
 * @param objectName - Name of the object
 * @param id - ID of the record
 * @returns DriverError instance
 */
export function createDuplicateRecordError(objectName: string, id: string | number): DriverError {
    return new DriverError({
        code: DriverErrorCodes.DUPLICATE_RECORD,
        message: `Record with id '${id}' already exists in '${objectName}'`,
        details: { objectName, id }
    });
}

/**
 * Create a standard error for validation failure
 * 
 * @param message - Error message
 * @param details - Additional details
 * @returns DriverError instance
 */
export function createValidationError(message: string, details?: any): DriverError {
    return new DriverError({
        code: DriverErrorCodes.VALIDATION_ERROR,
        message,
        details
    });
}

/**
 * Create a standard error for connection issues
 * 
 * @param message - Error message
 * @param details - Additional details
 * @returns DriverError instance
 */
export function createConnectionError(message: string, details?: any): DriverError {
    return new DriverError({
        code: DriverErrorCodes.CONNECTION_ERROR,
        message,
        details
    });
}

/**
 * Create a standard error for transaction issues
 * 
 * @param message - Error message
 * @param details - Additional details
 * @returns DriverError instance
 */
export function createTransactionError(message: string, details?: any): DriverError {
    return new DriverError({
        code: DriverErrorCodes.TRANSACTION_ERROR,
        message,
        details
    });
}

/**
 * Create a standard error for query issues
 * 
 * @param message - Error message
 * @param details - Additional details
 * @returns DriverError instance
 */
export function createQueryError(message: string, details?: any): DriverError {
    return new DriverError({
        code: DriverErrorCodes.QUERY_ERROR,
        message,
        details
    });
}

/**
 * Wrap a native error into a DriverError
 * 
 * @param error - Native error to wrap
 * @param context - Additional context information
 * @returns DriverError instance
 */
export function wrapError(error: Error, context?: { operation?: string; objectName?: string; details?: any }): DriverError {
    if (error instanceof DriverError) {
        return error;
    }
    
    return new DriverError({
        code: DriverErrorCodes.DRIVER_ERROR,
        message: error.message,
        details: {
            originalError: error.name,
            stack: error.stack,
            ...context
        }
    });
}

/**
 * Safe error handler that ensures errors are properly formatted
 * 
 * @param fn - Function to wrap
 * @returns Wrapped function that catches and formats errors
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: { operation?: string; objectName?: string }
): T {
    return (async (...args: any[]) => {
        try {
            return await fn(...args);
        } catch (error) {
            throw wrapError(error as Error, context);
        }
    }) as T;
}
