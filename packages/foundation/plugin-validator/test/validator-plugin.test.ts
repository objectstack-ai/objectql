/**
 * ObjectQL Validator Plugin Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ValidatorPlugin } from '../src/validator-plugin';
import { ObjectKernel } from '@objectstack/runtime';

describe('ValidatorPlugin', () => {
    let plugin: ValidatorPlugin;
    let mockKernel: any;
    let mockCtx: any;

    beforeEach(() => {
        // Create a mock kernel with middleware support
        mockKernel = {
            use: jest.fn(),
        };
        mockCtx = {
            app: mockKernel,
            hook: jest.fn(),
        };
        plugin = new ValidatorPlugin();
    });

    describe('Plugin Metadata', () => {
        it('should have correct name and version', () => {
            expect(plugin.name).toBe('@objectql/validator');
            expect(plugin.version).toBe('4.0.0');
        });
    });

    describe('Constructor', () => {
        it('should create plugin with default config', () => {
            const defaultPlugin = new ValidatorPlugin();
            expect(defaultPlugin).toBeDefined();
        });

        it('should create plugin with custom config', () => {
            const customPlugin = new ValidatorPlugin({
                language: 'zh-CN',
                enableQueryValidation: false,
                enableMutationValidation: true,
            });
            expect(customPlugin).toBeDefined();
        });

        it('should accept language options', () => {
            const customPlugin = new ValidatorPlugin({
                language: 'fr',
                languageFallback: ['en', 'zh-CN'],
            });
            expect(customPlugin).toBeDefined();
        });
    });

    describe('Installation', () => {
        it('should install successfully with mock kernel', async () => {
            await plugin.init(mockCtx);
            
            // Verify that middleware hooks were registered
            expect(mockCtx.hook).toHaveBeenCalled();
        });

        it('should register query validation when enabled', async () => {
            const pluginWithQuery = new ValidatorPlugin({ enableQueryValidation: true });
            
            await pluginWithQuery.init(mockCtx);
            
            // Check that use was called (for query validation)
            expect(mockCtx.hook).toHaveBeenCalledWith('beforeQuery', expect.any(Function));
        });

        it('should register mutation validation when enabled', async () => {
            const pluginWithMutation = new ValidatorPlugin({ enableMutationValidation: true });
            
            await pluginWithMutation.init(mockCtx);
            
            // Check that use was called (for mutation validation)
            expect(mockCtx.hook).toHaveBeenCalledWith('beforeMutation', expect.any(Function));
        });

        it('should not register query validation when disabled', async () => {
            const pluginNoQuery = new ValidatorPlugin({ enableQueryValidation: false });
            
            await pluginNoQuery.init(mockCtx);
            
            // Should not have registered beforeQuery hook
            const beforeQueryCalls = mockCtx.hook.mock.calls.filter(
                (call: any[]) => call[0] === 'beforeQuery'
            );
            expect(beforeQueryCalls.length).toBe(0);
        });

        it('should not register mutation validation when disabled', async () => {
            const pluginNoMutation = new ValidatorPlugin({ enableMutationValidation: false });
            
            await pluginNoMutation.init(mockCtx);
            
            // Should not have registered beforeMutation hook
            const beforeMutationCalls = mockCtx.hook.mock.calls.filter(
                (call: any[]) => call[0] === 'beforeMutation'
            );
            expect(beforeMutationCalls.length).toBe(0);
        });

        it('should handle kernel without middleware support', async () => {
            const kernelNoMiddleware = {};
            const ctx = { app: kernelNoMiddleware, hook: undefined }; // Simulate no hook support
            
            // Should not throw error
            await expect(plugin.init(ctx)).resolves.not.toThrow();
        });
    });

    describe('Validator Access', () => {
        it('should expose validator instance', () => {
            const validator = plugin.getValidator();
            expect(validator).toBeDefined();
            expect(typeof validator.validate).toBe('function');
        });
    });
});
