/**
 * Transaction Utilities
 * 
 * Provides utilities for managing transactions across drivers
 */

/**
 * Transaction state enum
 */
export enum TransactionState {
    ACTIVE = 'active',
    COMMITTED = 'committed',
    ROLLED_BACK = 'rolled_back',
    ABORTED = 'aborted'
}

/**
 * Base transaction interface
 */
export interface BaseTransaction {
    id: string;
    state: TransactionState;
    startedAt: Date;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
    isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
    timeout?: number;
}

/**
 * Generate a unique transaction ID
 * 
 * @returns Transaction ID
 */
export function generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a base transaction object
 * 
 * @param options - Transaction options
 * @returns Transaction object
 */
export function createTransaction(options?: TransactionOptions): BaseTransaction {
    return {
        id: generateTransactionId(),
        state: TransactionState.ACTIVE,
        startedAt: new Date()
    };
}

/**
 * Validate transaction state
 * 
 * @param transaction - Transaction to validate
 * @param expectedState - Expected state
 * @returns true if transaction is in expected state
 */
export function validateTransactionState(
    transaction: BaseTransaction,
    expectedState: TransactionState
): boolean {
    return transaction.state === expectedState;
}

/**
 * Check if transaction is active
 * 
 * @param transaction - Transaction to check
 * @returns true if transaction is active
 */
export function isTransactionActive(transaction: BaseTransaction): boolean {
    return transaction.state === TransactionState.ACTIVE;
}

/**
 * Mark transaction as committed
 * 
 * @param transaction - Transaction to mark
 */
export function markCommitted(transaction: BaseTransaction): void {
    transaction.state = TransactionState.COMMITTED;
}

/**
 * Mark transaction as rolled back
 * 
 * @param transaction - Transaction to mark
 */
export function markRolledBack(transaction: BaseTransaction): void {
    transaction.state = TransactionState.ROLLED_BACK;
}

/**
 * Transaction timeout checker
 * 
 * @param transaction - Transaction to check
 * @param timeoutMs - Timeout in milliseconds
 * @returns true if transaction has timed out
 */
export function hasTransactionTimedOut(transaction: BaseTransaction, timeoutMs: number): boolean {
    const elapsed = Date.now() - transaction.startedAt.getTime();
    return elapsed > timeoutMs;
}
