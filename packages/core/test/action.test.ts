import { ObjectQL } from '../src';
import { MockDriver } from './mock-driver';

describe('ObjectQL Actions', () => {
    let app: ObjectQL;
    let driver: MockDriver;

    beforeEach(async () => {
        driver = new MockDriver();
        app = new ObjectQL({
            datasources: {
                default: driver
            },
            objects: {
                'invoice': {
                    name: 'invoice',
                    fields: {
                        amount: { type: 'number' },
                        status: { type: 'text' },
                        paid_amount: { type: 'number' }
                    },
                    actions: {
                        'pay': {
                            type: 'record',
                            label: 'Pay Invoice',
                            params: {
                                method: { type: 'text' }
                            }
                        },
                        'import_invoices': {
                            type: 'global',
                            label: 'Import Invoices',
                            params: {
                                source: { type: 'text' }
                            }
                        }
                    }
                }
            }
        });
        await app.init();
    });

    describe('Record Actions', () => {
        it('should execute record action with id parameter', async () => {
            const repo = app.createContext({}).object('invoice');
            
            // Create an invoice first
            const invoice = await repo.create({ amount: 1000, status: 'pending' });
            
            let actionCalled = false;
            app.registerAction('invoice', 'pay', async (ctx) => {
                actionCalled = true;
                expect(ctx.objectName).toBe('invoice');
                expect(ctx.actionName).toBe('pay');
                expect(ctx.id).toBe(invoice._id);
                expect(ctx.input.method).toBe('credit_card');
                
                // Update the invoice status
                await ctx.api.update('invoice', ctx.id!, { 
                    status: 'paid',
                    paid_amount: ctx.input.amount || 1000
                });
                
                return { success: true, paid: true };
            });

            const result = await repo.execute('pay', invoice._id, { method: 'credit_card', amount: 1000 });
            
            expect(actionCalled).toBe(true);
            expect(result.success).toBe(true);
            expect(result.paid).toBe(true);
        });

        it('should provide access to record data via api', async () => {
            const repo = app.createContext({}).object('invoice');
            
            const invoice = await repo.create({ amount: 500, status: 'pending' });
            
            app.registerAction('invoice', 'pay', async (ctx) => {
                // Fetch current record
                const current = await ctx.api.findOne('invoice', ctx.id!);
                expect(current).toBeDefined();
                expect(current.amount).toBe(500);
                
                return { currentAmount: current.amount };
            });

            const result = await repo.execute('pay', invoice._id, { method: 'cash' });
            expect(result.currentAmount).toBe(500);
        });

        it('should validate business rules in record action', async () => {
            const repo = app.createContext({}).object('invoice');
            
            const invoice = await repo.create({ amount: 1000, status: 'paid' });
            
            app.registerAction('invoice', 'pay', async (ctx) => {
                const current = await ctx.api.findOne('invoice', ctx.id!);
                if (current.status === 'paid') {
                    throw new Error('Invoice is already paid');
                }
                return { success: true };
            });

            await expect(repo.execute('pay', invoice._id, { method: 'credit_card' }))
                .rejects
                .toThrow('Invoice is already paid');
        });

        it('should provide user context in action', async () => {
            const repo = app.createContext({ userId: 'user123', userName: 'John Doe' }).object('invoice');
            
            const invoice = await repo.create({ amount: 100, status: 'pending' });
            
            let capturedUser: any;
            app.registerAction('invoice', 'pay', async (ctx) => {
                capturedUser = ctx.user;
                return { success: true };
            });

            await repo.execute('pay', invoice._id, { method: 'cash' });
            
            expect(capturedUser).toBeDefined();
            expect(capturedUser.id).toBe('user123');
        });
    });

    describe('Global Actions', () => {
        it('should execute global action without id parameter', async () => {
            const repo = app.createContext({}).object('invoice');
            
            let actionCalled = false;
            app.registerAction('invoice', 'import_invoices', async (ctx) => {
                actionCalled = true;
                expect(ctx.objectName).toBe('invoice');
                expect(ctx.actionName).toBe('import_invoices');
                expect(ctx.id).toBeUndefined();
                expect(ctx.input.source).toBe('external_api');
                
                // Create multiple records
                await ctx.api.create('invoice', { amount: 100, status: 'pending' });
                await ctx.api.create('invoice', { amount: 200, status: 'pending' });
                
                return { imported: 2 };
            });

            const result = await repo.execute('import_invoices', undefined, { source: 'external_api' });
            
            expect(actionCalled).toBe(true);
            expect(result.imported).toBe(2);
        });

        it('should perform batch operations in global action', async () => {
            const repo = app.createContext({}).object('invoice');
            
            // Create some test invoices
            await repo.create({ amount: 100, status: 'pending' });
            await repo.create({ amount: 200, status: 'pending' });
            await repo.create({ amount: 300, status: 'paid' });
            
            app.registerAction('invoice', 'import_invoices', async (ctx) => {
                // Count pending invoices
                const count = await ctx.api.count('invoice', { 
                    filters: [['status', '=', 'pending']] 
                });
                
                return { pendingCount: count };
            });

            const result = await repo.execute('import_invoices', undefined, { source: 'test' });
            expect(result.pendingCount).toBe(2);
        });
    });

    describe('Action Input Validation', () => {
        it('should receive validated input parameters', async () => {
            const repo = app.createContext({}).object('invoice');
            
            const invoice = await repo.create({ amount: 1000, status: 'pending' });
            
            app.registerAction('invoice', 'pay', async (ctx) => {
                // Input should match the params defined in action config
                expect(ctx.input).toBeDefined();
                expect(typeof ctx.input.method).toBe('string');
                
                return { method: ctx.input.method };
            });

            const result = await repo.execute('pay', invoice._id, { method: 'bank_transfer' });
            expect(result.method).toBe('bank_transfer');
        });

        it('should handle missing optional parameters', async () => {
            const repo = app.createContext({}).object('invoice');
            
            const invoice = await repo.create({ amount: 1000, status: 'pending' });
            
            app.registerAction('invoice', 'pay', async (ctx) => {
                // Optional parameters might be undefined
                const comment = ctx.input.comment || 'No comment';
                return { comment };
            });

            const result = await repo.execute('pay', invoice._id, { method: 'cash' });
            expect(result.comment).toBe('No comment');
        });
    });

    describe('Error Handling', () => {
        it('should throw error if action not registered', async () => {
            const repo = app.createContext({}).object('invoice');
            await expect(repo.execute('refund', '1', {}))
                .rejects
                .toThrow("Action 'refund' not found for object 'invoice'");
        });

        it('should propagate errors from action handler', async () => {
            const repo = app.createContext({}).object('invoice');
            
            const invoice = await repo.create({ amount: 1000, status: 'pending' });
            
            app.registerAction('invoice', 'pay', async (ctx) => {
                throw new Error('Payment gateway is down');
            });

            await expect(repo.execute('pay', invoice._id, { method: 'credit_card' }))
                .rejects
                .toThrow('Payment gateway is down');
        });
    });

    describe('Complex Action Workflows', () => {
        it('should perform multi-step operations in action', async () => {
            const repo = app.createContext({}).object('invoice');
            
            const invoice = await repo.create({ amount: 1000, status: 'pending', paid_amount: 0 });
            
            app.registerAction('invoice', 'pay', async (ctx) => {
                // Step 1: Fetch current state
                const current = await ctx.api.findOne('invoice', ctx.id!);
                
                // Step 2: Validate
                if (current.status === 'paid') {
                    throw new Error('Already paid');
                }
                
                // Step 3: Update invoice
                await ctx.api.update('invoice', ctx.id!, {
                    status: 'paid',
                    paid_amount: current.amount
                });
                
                // Step 4: Could create related records (e.g., payment record)
                // await ctx.api.create('payment', { ... });
                
                return { 
                    success: true, 
                    amount: current.amount,
                    newStatus: 'paid'
                };
            });

            const result = await repo.execute('pay', invoice._id, { method: 'credit_card' });
            
            expect(result.success).toBe(true);
            expect(result.amount).toBe(1000);
            expect(result.newStatus).toBe('paid');
            
            // Verify the update
            const updated = await repo.findOne(invoice._id);
            expect(updated.status).toBe('paid');
            expect(updated.paid_amount).toBe(1000);
        });
    });
});
