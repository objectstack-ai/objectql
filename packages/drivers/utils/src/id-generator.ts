/**
 * ID Generation Utilities
 * 
 * Provides various ID generation strategies for drivers
 */

/**
 * Default ID length for nanoid-style IDs
 */
const DEFAULT_ID_LENGTH = 16;

/**
 * Characters used for nanoid generation
 */
const NANOID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generate a random nanoid-style ID
 * 
 * @param length - Length of the ID (default: 16)
 * @returns Generated ID string
 */
export function generateNanoId(length: number = DEFAULT_ID_LENGTH): string {
    let id = '';
    const alphabetLength = NANOID_ALPHABET.length;
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * alphabetLength);
        id += NANOID_ALPHABET[randomIndex];
    }
    
    return id;
}

/**
 * Generate a UUID v4
 * 
 * @returns UUID string in format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Generate a sequential numeric ID
 * 
 * @param counter - Current counter value
 * @param prefix - Optional prefix for the ID
 * @returns Generated ID
 */
export function generateSequentialId(counter: number, prefix?: string): string {
    const id = counter.toString();
    return prefix ? `${prefix}${id}` : id;
}

/**
 * Generate a timestamp-based ID
 * 
 * @param prefix - Optional prefix for the ID
 * @returns Generated ID with timestamp
 */
export function generateTimestampId(prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const id = `${timestamp}-${random}`;
    return prefix ? `${prefix}-${id}` : id;
}

/**
 * ID Generator class for managing sequential IDs per object type
 */
export class IDGenerator {
    private counters: Map<string, number>;
    
    constructor() {
        this.counters = new Map();
    }
    
    /**
     * Generate next sequential ID for an object type
     * 
     * @param objectName - Name of the object type
     * @param prefix - Optional prefix
     * @returns Generated ID
     */
    generateSequential(objectName: string, prefix?: string): string {
        const current = this.counters.get(objectName) || 0;
        const next = current + 1;
        this.counters.set(objectName, next);
        
        return generateSequentialId(next, prefix);
    }
    
    /**
     * Generate random ID
     * 
     * @param length - Length of the ID
     * @returns Generated ID
     */
    generateRandom(length: number = DEFAULT_ID_LENGTH): string {
        return generateNanoId(length);
    }
    
    /**
     * Reset counter for an object type
     * 
     * @param objectName - Name of the object type
     */
    reset(objectName: string): void {
        this.counters.delete(objectName);
    }
    
    /**
     * Reset all counters
     */
    resetAll(): void {
        this.counters.clear();
    }
    
    /**
     * Get current counter value
     * 
     * @param objectName - Name of the object type
     * @returns Current counter value
     */
    getCounter(objectName: string): number {
        return this.counters.get(objectName) || 0;
    }
}
