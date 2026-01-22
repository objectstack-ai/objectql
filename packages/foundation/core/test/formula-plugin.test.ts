/**
 * ObjectQL Formula Plugin Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { FormulaPlugin } from '../src/formula-plugin';
import { ObjectStackKernel } from '@objectstack/runtime';

describe('FormulaPlugin', () => {
    let plugin: FormulaPlugin;
    let mockKernel: any;

    beforeEach(() => {
        // Create a mock kernel with middleware and formula provider support
        mockKernel = {
            use: jest.fn(),
            registerFormulaProvider: jest.fn(),
        };
        plugin = new FormulaPlugin();
    });

    describe('Plugin Metadata', () => {
        it('should have correct name and version', () => {
            expect(plugin.name).toBe('@objectql/formulas');
            expect(plugin.version).toBe('4.0.0');
        });
    });

    describe('Constructor', () => {
        it('should create plugin with default config', () => {
            const defaultPlugin = new FormulaPlugin();
            expect(defaultPlugin).toBeDefined();
        });

        it('should create plugin with custom config', () => {
            const customPlugin = new FormulaPlugin({
                enable_cache: true,
                cache_ttl: 600,
                autoEvaluateOnQuery: false,
            });
            expect(customPlugin).toBeDefined();
        });

        it('should accept formula engine config', () => {
            const customPlugin = new FormulaPlugin({
                enable_monitoring: true,
                max_execution_time: 5000,
            });
            expect(customPlugin).toBeDefined();
        });
    });

    describe('Installation', () => {
        it('should install successfully with mock kernel', async () => {
            const ctx = { engine: mockKernel };
            await plugin.install(ctx);
            
            // Verify that formula provider was registered
            expect(mockKernel.registerFormulaProvider).toHaveBeenCalled();
        });

        it('should register formula provider with evaluate function', async () => {
            const ctx = { engine: mockKernel };
            await plugin.install(ctx);
            
            expect(mockKernel.registerFormulaProvider).toHaveBeenCalledWith(
                expect.objectContaining({
                    evaluate: expect.any(Function),
                    validate: expect.any(Function),
                    extractMetadata: expect.any(Function),
                })
            );
        });

        it('should register formula middleware when auto-evaluation is enabled', async () => {
            const pluginWithAuto = new FormulaPlugin({ autoEvaluateOnQuery: true });
            const ctx = { engine: mockKernel };
            
            await pluginWithAuto.install(ctx);
            
            // Check that middleware was registered
            expect(mockKernel.use).toHaveBeenCalledWith('afterQuery', expect.any(Function));
        });

        it('should not register formula middleware when auto-evaluation is disabled', async () => {
            const pluginNoAuto = new FormulaPlugin({ autoEvaluateOnQuery: false });
            const ctx = { engine: mockKernel };
            
            await pluginNoAuto.install(ctx);
            
            // Should not have registered afterQuery hook
            const afterQueryCalls = mockKernel.use.mock.calls.filter(
                (call: any[]) => call[0] === 'afterQuery'
            );
            expect(afterQueryCalls.length).toBe(0);
        });

        it('should handle kernel without registerFormulaProvider', async () => {
            const kernelNoProvider = {
                use: jest.fn(),
            };
            const ctx = { engine: kernelNoProvider };
            
            // Should not throw error and should set formulaEngine property
            await expect(plugin.install(ctx)).resolves.not.toThrow();
            expect((kernelNoProvider as any).formulaEngine).toBeDefined();
        });

        it('should handle kernel without middleware support', async () => {
            const kernelNoMiddleware = {
                registerFormulaProvider: jest.fn(),
            };
            const ctx = { engine: kernelNoMiddleware };
            
            // Should not throw error
            await expect(plugin.install(ctx)).resolves.not.toThrow();
        });
    });

    describe('Formula Provider', () => {
        it('should provide evaluate function that works', async () => {
            const ctx = { engine: mockKernel };
            await plugin.install(ctx);
            
            // Get the registered provider
            const provider = mockKernel.registerFormulaProvider.mock.calls[0][0];
            
            // Test the evaluate function
            const result = provider.evaluate('1 + 1', {
                record: {},
                system: {
                    today: new Date(),
                    now: new Date(),
                    year: 2026,
                    month: 1,
                    day: 22,
                    hour: 12,
                    minute: 0,
                    second: 0,
                },
                current_user: {},
                is_new: false,
            });
            
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            // The result is coerced to 'text' by default, so it's a string "2"
            expect(result.value).toBe('2');
        });

        it('should provide validate function that works', async () => {
            const ctx = { engine: mockKernel };
            await plugin.install(ctx);
            
            // Get the registered provider
            const provider = mockKernel.registerFormulaProvider.mock.calls[0][0];
            
            // Test the validate function
            const result = provider.validate('quantity * price');
            
            expect(result).toBeDefined();
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should provide extractMetadata function that works', async () => {
            const ctx = { engine: mockKernel };
            await plugin.install(ctx);
            
            // Get the registered provider
            const provider = mockKernel.registerFormulaProvider.mock.calls[0][0];
            
            // Test the extractMetadata function
            const metadata = provider.extractMetadata('total', 'quantity * price', 'number');
            
            expect(metadata).toBeDefined();
            expect(metadata.field_name).toBe('total');
            expect(metadata.expression).toBe('quantity * price');
            expect(metadata.data_type).toBe('number');
            expect(metadata.dependencies).toContain('quantity');
            expect(metadata.dependencies).toContain('price');
        });
    });

    describe('Engine Access', () => {
        it('should expose formula engine instance', () => {
            const engine = plugin.getEngine();
            expect(engine).toBeDefined();
            expect(typeof engine.evaluate).toBe('function');
            expect(typeof engine.validate).toBe('function');
            expect(typeof engine.extractMetadata).toBe('function');
        });
    });
});
