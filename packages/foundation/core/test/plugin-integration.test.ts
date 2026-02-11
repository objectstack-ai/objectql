/**
 * ObjectQL Plugin Integration Tests
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ObjectQLPlugin } from '../src/plugin';
import { ValidatorPlugin } from '@objectql/plugin-validator';
import { FormulaPlugin } from '@objectql/plugin-formula';
import { vi } from 'vitest';

// Mock the sub-plugins
vi.mock('@objectql/plugin-validator');
vi.mock('@objectql/plugin-formula');

describe('ObjectQLPlugin Integration', () => {
    let plugin: ObjectQLPlugin;
    let mockKernel: any;
    let mockContext: any;

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        
        // Create a mock kernel
        mockKernel = {
            use: jest.fn(),
            registerFormulaProvider: jest.fn(),
        };
        
        mockContext = { app: mockKernel };
        
        // Setup mock implementations
        (ValidatorPlugin as jest.Mock).mockImplementation(() => ({
            install: jest.fn().mockResolvedValue(undefined),
        }));
        
        (FormulaPlugin as jest.Mock).mockImplementation(() => ({
            install: jest.fn().mockResolvedValue(undefined),
        }));
    });

    describe('Plugin Metadata', () => {
        it('should have correct name and version', () => {
            plugin = new ObjectQLPlugin();
            expect(plugin.name).toBe('@objectql/core');
            expect(plugin.version).toBe('4.2.0');
        });
    });

    describe('Constructor', () => {
        it('should create plugin with default config', () => {
            plugin = new ObjectQLPlugin();
            expect(plugin).toBeDefined();
        });

        it('should create plugin with custom config', () => {
            plugin = new ObjectQLPlugin({
                enableRepository: false,
                enableValidator: false,
                enableFormulas: true,
                enableAI: false,
            });
            expect(plugin).toBeDefined();
        });

        it('should accept validator config', () => {
            plugin = new ObjectQLPlugin({
                validatorConfig: {
                    language: 'zh-CN',
                    enableQueryValidation: false,
                },
            });
            expect(plugin).toBeDefined();
        });

        it('should accept formula config', () => {
            plugin = new ObjectQLPlugin({
                formulaConfig: {
                    enable_cache: true,
                    cache_ttl: 600,
                },
            });
            expect(plugin).toBeDefined();
        });
    });

    describe('Installation - Conditional Plugin Loading', () => {
        it('should install validator plugin when enabled', async () => {
            plugin = new ObjectQLPlugin({ enableValidator: true });
            const runtimeContext = { engine: mockContext.app };
            await plugin.install(runtimeContext);
            
            expect(ValidatorPlugin).toHaveBeenCalled();
            const validatorInstance = (ValidatorPlugin as jest.Mock).mock.results[0].value;
            expect(validatorInstance.install).toHaveBeenCalledWith(runtimeContext);
        });

        it('should not install validator plugin when disabled', async () => {
            plugin = new ObjectQLPlugin({ enableValidator: false });
            const runtimeContext = { engine: mockContext.app };
            await plugin.install(runtimeContext);
            
            expect(ValidatorPlugin).not.toHaveBeenCalled();
        });

        it('should install formula plugin when enabled', async () => {
            plugin = new ObjectQLPlugin({ enableFormulas: true });
            const runtimeContext = { engine: mockContext.app };
            await plugin.install(runtimeContext);
            
            expect(FormulaPlugin).toHaveBeenCalled();
            const formulaInstance = (FormulaPlugin as jest.Mock).mock.results[0].value;
            expect(formulaInstance.install).toHaveBeenCalledWith(runtimeContext);
        });

        it('should not install formula plugin when disabled', async () => {
            plugin = new ObjectQLPlugin({ enableFormulas: false });
            const runtimeContext = { engine: mockContext.app };
            await plugin.install(runtimeContext);
            
            expect(FormulaPlugin).not.toHaveBeenCalled();
        });

        it('should pass validator config to validator plugin', async () => {
            const validatorConfig = {
                language: 'zh-CN',
                enableQueryValidation: false,
            };
            
            plugin = new ObjectQLPlugin({
                enableValidator: true,
                validatorConfig,
            });
            
            const runtimeContext = { engine: mockContext.app };
            await plugin.install(runtimeContext);
            
            expect(ValidatorPlugin).toHaveBeenCalledWith(validatorConfig);
        });

        it('should pass formula config to formula plugin', async () => {
            const formulaConfig = {
                enable_cache: true,
                cache_ttl: 600,
            };
            
            plugin = new ObjectQLPlugin({
                enableFormulas: true,
                formulaConfig,
            });
            
            const runtimeContext = { engine: mockContext.app };
            await plugin.install(runtimeContext);
            
            expect(FormulaPlugin).toHaveBeenCalledWith(formulaConfig);
        });

        it('should install multiple plugins when all enabled', async () => {
            plugin = new ObjectQLPlugin({
                enableValidator: true,
                enableFormulas: true,
            });
            
            const runtimeContext = { engine: mockContext.app };
            await plugin.install(runtimeContext);
            
            expect(ValidatorPlugin).toHaveBeenCalled();
            expect(FormulaPlugin).toHaveBeenCalled();
        });

        it('should not install any plugins when all disabled', async () => {
            plugin = new ObjectQLPlugin({
                enableRepository: false,
                enableValidator: false,
                enableFormulas: false,
                enableAI: false,
            });
            
            const runtimeContext = { engine: mockContext.app };
            await plugin.install(runtimeContext);
            
            expect(ValidatorPlugin).not.toHaveBeenCalled();
            expect(FormulaPlugin).not.toHaveBeenCalled();
        });
    });

    describe('Lifecycle Hooks', () => {
        it('should have onStart method', async () => {
            plugin = new ObjectQLPlugin();
            expect(typeof plugin.onStart).toBe('function');
            
            const runtimeContext = { engine: mockContext.app };
            // Should not throw when called
            await expect(plugin.onStart(runtimeContext)).resolves.not.toThrow();
        });
    });

    describe('Default Configuration', () => {
        it('should enable all features by default', async () => {
            plugin = new ObjectQLPlugin();
            const runtimeContext = { engine: mockContext.app };
            await plugin.install(runtimeContext);
            
            // Validator and Formula should be installed by default
            expect(ValidatorPlugin).toHaveBeenCalled();
            expect(FormulaPlugin).toHaveBeenCalled();
        });

        it('should treat undefined config as enabled', async () => {
            plugin = new ObjectQLPlugin({
                // Explicitly not setting enableValidator or enableFormulas
            });
            
            const runtimeContext = { engine: mockContext.app };
            await plugin.install(runtimeContext);
            
            // Both should still be installed
            expect(ValidatorPlugin).toHaveBeenCalled();
            expect(FormulaPlugin).toHaveBeenCalled();
        });
    });
});
