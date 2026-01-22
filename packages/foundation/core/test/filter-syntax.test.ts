/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQL } from '../src/index';
import { MockDriver } from './mock-driver';
import { ObjectConfig } from '@objectql/types';

/**
 * Modern Filter Syntax Tests
 * 
 * Tests the new object-based filter syntax from @objectstack/spec FilterCondition.
 * This replaces the old array-based FilterExpression syntax.
 * 
 * Note: These tests verify filter translation logic. Full filter functionality
 * is tested in driver integration tests.
 */

const productObject: ObjectConfig = {
    name: 'product',
    fields: {
        name: { type: 'text' },
        price: { type: 'number' },
        category: { type: 'text' },
        status: { type: 'text' }
    }
};

describe('Modern Filter Syntax - Translation', () => {
    let app: ObjectQL;
    let driver: MockDriver;

    beforeEach(async () => {
        driver = new MockDriver();
        app = new ObjectQL({
            datasources: {
                default: driver
            },
            objects: {
                product: productObject
            }
        });
        await app.init();
    });

    describe('Filter Translation to Kernel', () => {
        it('should accept object-based filter syntax', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            // This should not throw - it accepts the new syntax
            await expect(repo.find({
                filters: { category: 'Electronics' }
            })).resolves.toBeDefined();
        });

        it('should accept $eq operator', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            await expect(repo.find({
                filters: { status: { $eq: 'active' } }
            })).resolves.toBeDefined();
        });

        it('should accept $ne operator', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            await expect(repo.find({
                filters: { status: { $ne: 'inactive' } }
            })).resolves.toBeDefined();
        });

        it('should accept comparison operators', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            await expect(repo.find({
                filters: { price: { $gt: 100 } }
            })).resolves.toBeDefined();

            await expect(repo.find({
                filters: { price: { $gte: 100 } }
            })).resolves.toBeDefined();

            await expect(repo.find({
                filters: { price: { $lt: 500 } }
            })).resolves.toBeDefined();

            await expect(repo.find({
                filters: { price: { $lte: 500 } }
            })).resolves.toBeDefined();
        });

        it('should accept $in operator', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            await expect(repo.find({
                filters: { status: { $in: ['active', 'pending'] } }
            })).resolves.toBeDefined();
        });

        it('should accept $nin operator', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            await expect(repo.find({
                filters: { status: { $nin: ['inactive', 'deleted'] } }
            })).resolves.toBeDefined();
        });

        it('should accept $and operator', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            await expect(repo.find({
                filters: {
                    $and: [
                        { category: 'Electronics' },
                        { status: 'active' }
                    ]
                }
            })).resolves.toBeDefined();
        });

        it('should accept $or operator', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            await expect(repo.find({
                filters: {
                    $or: [
                        { category: 'Electronics' },
                        { category: 'Furniture' }
                    ]
                }
            })).resolves.toBeDefined();
        });

        it('should accept nested logical operators', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            await expect(repo.find({
                filters: {
                    $and: [
                        {
                            $or: [
                                { category: 'Electronics' },
                                { category: 'Furniture' }
                            ]
                        },
                        { status: 'active' }
                    ]
                }
            })).resolves.toBeDefined();
        });

        it('should accept multiple operators on same field', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            await expect(repo.find({
                filters: {
                    price: {
                        $gte: 100,
                        $lte: 500
                    }
                }
            })).resolves.toBeDefined();
        });

        it('should accept mixed implicit and explicit syntax', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            await expect(repo.find({
                filters: {
                    category: 'Electronics',
                    price: { $gte: 100 }
                }
            })).resolves.toBeDefined();
        });
    });

    describe('Backward Compatibility', () => {
        it('should still support legacy array-based filter syntax', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            // Old syntax should still work
            await expect(repo.find({
                filters: [['category', '=', 'Electronics']] as any
            })).resolves.toBeDefined();
        });

        it('should support legacy complex filters with logical operators', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            await expect(repo.find({
                filters: [
                    ['category', '=', 'Electronics'],
                    'and',
                    ['status', '=', 'active']
                ] as any
            })).resolves.toBeDefined();
        });

        it('should support legacy nested filter groups', async () => {
            const ctx = app.createContext({ userId: 'test', isSystem: true });
            const repo = ctx.object('product');

            await expect(repo.find({
                filters: [
                    [
                        ['category', '=', 'Electronics'],
                        'or',
                        ['category', '=', 'Furniture']
                    ],
                    'and',
                    ['status', '=', 'active']
                ] as any
            })).resolves.toBeDefined();
        });
    });
});
