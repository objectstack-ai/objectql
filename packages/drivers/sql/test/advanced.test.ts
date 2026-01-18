/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SqlDriver } from '../src';

describe('SqlDriver Advanced Operations (SQLite)', () => {
    let driver: SqlDriver;
    let knexInstance: any;

    beforeEach(async () => {
        driver = new SqlDriver({
            client: 'sqlite3',
            connection: {
                filename: ':memory:'
            },
            useNullAsDefault: true
        });
        knexInstance = (driver as any).knex;

        // Create test table with sample data
        await knexInstance.schema.createTable('orders', (t: any) => {
            t.string('id').primary();
            t.string('customer');
            t.string('product');
            t.float('amount');
            t.integer('quantity');
            t.string('status');
            t.timestamp('created_at').defaultTo(knexInstance.fn.now());
        });

        await knexInstance('orders').insert([
            { id: '1', customer: 'Alice', product: 'Laptop', amount: 1200.00, quantity: 1, status: 'completed' },
            { id: '2', customer: 'Bob', product: 'Mouse', amount: 25.50, quantity: 2, status: 'completed' },
            { id: '3', customer: 'Alice', product: 'Keyboard', amount: 75.00, quantity: 1, status: 'pending' },
            { id: '4', customer: 'Charlie', product: 'Monitor', amount: 350.00, quantity: 1, status: 'completed' },
            { id: '5', customer: 'Bob', product: 'Laptop', amount: 1200.00, quantity: 1, status: 'cancelled' },
        ]);
    });

    afterEach(async () => {
        await knexInstance.destroy();
    });

    describe('Aggregate Operations', () => {
        it('should sum values', async () => {
            const result = await driver.aggregate('orders', {
                filters: [['status', '=', 'completed']],
                aggregate: [
                    { func: 'sum', field: 'amount', alias: 'total_amount' }
                ]
            });

            expect(result).toHaveLength(1);
            expect(result[0].total_amount).toBe(1575.50);
        });

        it('should count records', async () => {
            const result = await driver.aggregate('orders', {
                aggregate: [
                    { func: 'count', field: '*', alias: 'total_orders' }
                ]
            });

            expect(result).toHaveLength(1);
            expect(result[0].total_orders).toBe(5);
        });

        it('should calculate average', async () => {
            const result = await driver.aggregate('orders', {
                filters: [['status', '=', 'completed']],
                aggregate: [
                    { func: 'avg', field: 'amount', alias: 'avg_amount' }
                ]
            });

            expect(result).toHaveLength(1);
            expect(result[0].avg_amount).toBeCloseTo(525.17, 2);
        });

        it('should find min and max values', async () => {
            const result = await driver.aggregate('orders', {
                aggregate: [
                    { func: 'min', field: 'amount', alias: 'min_amount' },
                    { func: 'max', field: 'amount', alias: 'max_amount' }
                ]
            });

            expect(result).toHaveLength(1);
            expect(result[0].min_amount).toBe(25.50);
            expect(result[0].max_amount).toBe(1200.00);
        });

        it('should group by with aggregates', async () => {
            const result = await driver.aggregate('orders', {
                groupBy: ['customer'],
                aggregate: [
                    { func: 'sum', field: 'amount', alias: 'total_spent' },
                    { func: 'count', field: '*', alias: 'order_count' }
                ]
            });

            expect(result).toHaveLength(3);
            
            const alice = result.find(r => r.customer === 'Alice');
            expect(alice.total_spent).toBe(1275.00);
            expect(alice.order_count).toBe(2);

            const bob = result.find(r => r.customer === 'Bob');
            expect(bob.total_spent).toBe(1225.50);
            expect(bob.order_count).toBe(2);
        });

        it('should handle multiple group by fields', async () => {
            const result = await driver.aggregate('orders', {
                groupBy: ['customer', 'status'],
                aggregate: [
                    { func: 'sum', field: 'quantity', alias: 'total_qty' }
                ]
            });

            expect(result.length).toBeGreaterThan(0);
            
            const aliceCompleted = result.find(r => r.customer === 'Alice' && r.status === 'completed');
            expect(aliceCompleted).toBeDefined();
            expect(aliceCompleted.total_qty).toBe(1);
        });

        it('should aggregate with filters and groupBy', async () => {
            const result = await driver.aggregate('orders', {
                filters: [['status', '!=', 'cancelled']],
                groupBy: ['product'],
                aggregate: [
                    { func: 'sum', field: 'quantity', alias: 'total_quantity' }
                ]
            });

            const laptop = result.find(r => r.product === 'Laptop');
            expect(laptop.total_quantity).toBe(1); // Only completed laptop order
        });
    });

    describe('Bulk Operations', () => {
        it('should create many records', async () => {
            const newOrders = [
                { id: '6', customer: 'Dave', product: 'Tablet', amount: 500.00, quantity: 1, status: 'pending' },
                { id: '7', customer: 'Eve', product: 'Phone', amount: 800.00, quantity: 1, status: 'pending' },
                { id: '8', customer: 'Frank', product: 'Headphones', amount: 150.00, quantity: 2, status: 'completed' }
            ];

            const result = await driver.createMany('orders', newOrders);
            
            expect(result).toBeDefined();
            expect(result.length).toBe(3);

            const count = await driver.count('orders', []);
            expect(count).toBe(8); // 5 original + 3 new
        });

        it('should update many records', async () => {
            const updated = await driver.updateMany('orders', 
                [['status', '=', 'pending']],
                { status: 'processing' }
            );

            expect(updated).toBeGreaterThan(0);

            const results = await driver.find('orders', {
                filters: [['status', '=', 'processing']]
            });

            expect(results.length).toBe(1); // Only 1 pending order originally
        });

        it('should delete many records', async () => {
            const deleted = await driver.deleteMany('orders', 
                [['status', '=', 'cancelled']]
            );

            expect(deleted).toBe(1);

            const remaining = await driver.count('orders', []);
            expect(remaining).toBe(4);
        });

        it('should handle empty bulk update and delete', async () => {
            const updated = await driver.updateMany('orders', 
                [['status', '=', 'nonexistent']],
                { status: 'updated' }
            );
            expect(updated).toBe(0);

            const deleted = await driver.deleteMany('orders', 
                [['id', '=', 'nonexistent']]
            );
            expect(deleted).toBe(0);
        });
    });

    describe('Transaction Support', () => {
        it('should commit a transaction', async () => {
            const trx = await driver.beginTransaction();

            try {
                await driver.create('orders', {
                    id: 'trx1',
                    customer: 'TxUser',
                    product: 'Item',
                    amount: 100.00,
                    quantity: 1,
                    status: 'completed'
                }, { transaction: trx });

                await driver.commitTransaction(trx);

                const result = await driver.findOne('orders', 'trx1');
                expect(result).toBeDefined();
                expect(result.customer).toBe('TxUser');
            } catch (e) {
                await driver.rollbackTransaction(trx);
                throw e;
            }
        });

        it('should rollback a transaction', async () => {
            const trx = await driver.beginTransaction();

            try {
                await driver.create('orders', {
                    id: 'trx2',
                    customer: 'TxUser2',
                    product: 'Item2',
                    amount: 200.00,
                    quantity: 1,
                    status: 'completed'
                }, { transaction: trx });

                await driver.rollbackTransaction(trx);

                const result = await driver.findOne('orders', 'trx2');
                expect(result).toBeUndefined();
            } catch (e) {
                await driver.rollbackTransaction(trx);
                throw e;
            }
        });

        it('should handle multiple operations in a transaction', async () => {
            const trx = await driver.beginTransaction();

            try {
                await driver.create('orders', {
                    id: 'trx3',
                    customer: 'MultiOp',
                    product: 'Product1',
                    amount: 100.00,
                    quantity: 1,
                    status: 'pending'
                }, { transaction: trx });

                await driver.update('orders', '1', {
                    status: 'shipped'
                }, { transaction: trx });

                await driver.delete('orders', '5', { transaction: trx });

                await driver.commitTransaction(trx);

                const created = await driver.findOne('orders', 'trx3');
                expect(created).toBeDefined();

                const updated = await driver.findOne('orders', '1');
                expect(updated.status).toBe('shipped');

                const deleted = await driver.findOne('orders', '5');
                expect(deleted).toBeUndefined();
            } catch (e) {
                await driver.rollbackTransaction(trx);
                throw e;
            }
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty filters gracefully', async () => {
            const results = await driver.find('orders', { filters: [] });
            expect(results.length).toBe(5);
        });

        it('should handle undefined query parameters', async () => {
            const results = await driver.find('orders', {});
            expect(results.length).toBe(5);
        });

        it('should handle null values in data', async () => {
            await knexInstance.schema.createTable('nullable_test', (t: any) => {
                t.string('id').primary();
                t.string('name').nullable();
                t.integer('value').nullable();
            });

            await driver.create('nullable_test', {
                id: '1',
                name: null,
                value: null
            });

            const result = await driver.findOne('nullable_test', '1');
            expect(result).toBeDefined();
            expect(result.name).toBeNull();
            expect(result.value).toBeNull();
        });

        it('should handle pagination with skip and limit', async () => {
            const page1 = await driver.find('orders', {
                sort: [['id', 'asc']],
                skip: 0,
                limit: 2
            });
            expect(page1.length).toBe(2);
            expect(page1[0].id).toBe('1');

            const page2 = await driver.find('orders', {
                sort: [['id', 'asc']],
                skip: 2,
                limit: 2
            });
            expect(page2.length).toBe(2);
            expect(page2[0].id).toBe('3');
        });

        it('should handle skip beyond total records', async () => {
            const results = await driver.find('orders', {
                skip: 100,
                limit: 10
            });
            expect(results.length).toBe(0);
        });

        it('should handle complex nested filters', async () => {
            const results = await driver.find('orders', {
                filters: [
                    [
                        ['status', '=', 'completed'],
                        'and',
                        ['amount', '>', 100]
                    ],
                    'or',
                    [
                        ['customer', '=', 'Alice'],
                        'and',
                        ['status', '=', 'pending']
                    ]
                ]
            });

            expect(results.length).toBeGreaterThan(0);
        });

        it('should handle contains filter', async () => {
            const results = await driver.find('orders', {
                filters: [['product', 'contains', 'top']]
            });

            expect(results.length).toBe(2); // Laptop matches
            expect(results.every(r => r.product.toLowerCase().includes('top'))).toBe(true);
        });

        it('should handle in filter', async () => {
            const results = await driver.find('orders', {
                filters: [['status', 'in', ['completed', 'pending']]]
            });

            expect(results.length).toBe(4);
        });

        it('should handle nin (not in) filter', async () => {
            const results = await driver.find('orders', {
                filters: [['status', 'nin', ['cancelled']]]
            });

            expect(results.length).toBe(4);
        });

        it('should handle findOne with query parameter', async () => {
            const result = await driver.findOne('orders', null as any, {
                filters: [['customer', '=', 'Charlie']]
            });

            expect(result).toBeDefined();
            expect(result.customer).toBe('Charlie');
        });

        it('should return undefined for non-existent record', async () => {
            const result = await driver.findOne('orders', 'nonexistent');
            expect(result).toBeUndefined();
        });

        it('should handle count with complex filters', async () => {
            const count = await driver.count('orders', [
                ['status', '=', 'completed'],
                'and',
                ['amount', '>', 100]
            ]);

            expect(count).toBe(2); // Laptop and Monitor orders
        });
    });
});
