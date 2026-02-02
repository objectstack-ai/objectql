/**
 * Timestamp Utilities
 * 
 * Provides utilities for managing timestamps in driver records
 */

/**
 * Get current ISO timestamp
 * 
 * @returns ISO 8601 timestamp string
 */
export function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Add timestamps to a record for create operation
 * 
 * @param data - Record data
 * @param preserveExisting - Whether to preserve existing timestamps (default: true)
 * @returns Record with timestamps
 */
export function addCreateTimestamps<T extends Record<string, any>>(
    data: T,
    preserveExisting: boolean = true
): T & { created_at: string; updated_at: string } {
    const now = getCurrentTimestamp();
    
    return {
        ...data,
        created_at: preserveExisting && data.created_at ? data.created_at : now,
        updated_at: preserveExisting && data.updated_at ? data.updated_at : now
    };
}

/**
 * Add timestamps to a record for update operation
 * 
 * @param data - Record data
 * @param existingCreatedAt - Existing created_at value to preserve
 * @returns Record with updated timestamp
 */
export function addUpdateTimestamps<T extends Record<string, any>>(
    data: T,
    existingCreatedAt?: string
): T & { created_at?: string; updated_at: string } {
    const result: any = {
        ...data,
        updated_at: getCurrentTimestamp()
    };
    
    // Preserve existing created_at if provided
    if (existingCreatedAt) {
        result.created_at = existingCreatedAt;
    }
    
    return result;
}

/**
 * Strip timestamp fields from data
 * 
 * Useful when you want to prevent manual timestamp manipulation
 * 
 * @param data - Record data
 * @returns Record without timestamp fields
 */
export function stripTimestamps<T extends Record<string, any>>(data: T): Omit<T, 'created_at' | 'updated_at'> {
    const { created_at, updated_at, ...rest } = data;
    return rest as Omit<T, 'created_at' | 'updated_at'>;
}

/**
 * Validate timestamp format (ISO 8601)
 * 
 * @param timestamp - Timestamp string to validate
 * @returns true if valid ISO 8601 timestamp
 */
export function isValidTimestamp(timestamp: string): boolean {
    if (typeof timestamp !== 'string') {
        return false;
    }
    
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) && date.toISOString() === timestamp;
}
