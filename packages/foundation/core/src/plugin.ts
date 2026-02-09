/**
 * ObjectQL Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/types';
import { ConsoleLogger } from '@objectql/types';
import type { Logger } from '@objectql/types';
import { ValidatorPlugin, ValidatorPluginConfig } from '@objectql/plugin-validator';
import { FormulaPlugin, FormulaPluginConfig } from '@objectql/plugin-formula';
import { QueryService } from './query/query-service';
import { QueryAnalyzer } from './query/query-analyzer';
import { ObjectStackProtocolImplementation } from './protocol';
import type { Driver } from '@objectql/types';
import { createDefaultAiRegistry } from './ai';

/**
 * Extended kernel with ObjectQL services
 */
interface ExtendedKernel {
    metadata?: any;
    actions?: any;
    hooks?: any;
    getAllDrivers?: () => Driver[];
    create?: (objectName: string, data: any) => Promise<any>;
    update?: (objectName: string, id: string, data: any) => Promise<any>;
    delete?: (objectName: string, id: string) => Promise<any>;
    find?: (objectName: string, query: any) => Promise<any>;
    get?: (objectName: string, id: string) => Promise<any>;
    queryService?: QueryService;
    queryAnalyzer?: QueryAnalyzer;
}

/**
 * Configuration for the ObjectQL Plugin
 */
export interface ObjectQLPluginConfig {
  /**
   * Enable repository pattern for data access
   * @default true
   */
  enableRepository?: boolean;
  
  /**
   * Enable validation engine
   * @default true
   */
  enableValidator?: boolean;
  
  /**
   * Validator plugin configuration
   * Only used if enableValidator is not false
   */
  validatorConfig?: ValidatorPluginConfig;
  
  /**
   * Enable formula engine
   * @default true
   */
  enableFormulas?: boolean;
  
  /**
   * Formula plugin configuration
   * Only used if enableFormulas is not false
   */
  formulaConfig?: FormulaPluginConfig;
  
  /**
   * Enable AI integration
   * @default true
   */
  enableAI?: boolean;
  
  /**
   * Enable query service and analyzer
   * @default true
   */
  enableQueryService?: boolean;
  
  /**
   * Datasources for query service
   * Required if enableQueryService is true
   */
  datasources?: Record<string, Driver>;
}

/**
 * ObjectQL Plugin
 * 
 * Implements the RuntimePlugin interface to provide ObjectQL's enhanced features
 * (Repository, Validator, Formula, AI) on top of the microkernel.
 */
export class ObjectQLPlugin implements RuntimePlugin {
  name = '@objectql/core';
  version = '4.0.2';
  private logger: Logger;
  
  constructor(private config: ObjectQLPluginConfig = {}, ql?: any) {
    // Set defaults
    this.config = {
      enableRepository: true,
      enableValidator: true,
      enableFormulas: true,
      enableAI: true,
      enableQueryService: true,
      ...config
    };
    this.logger = new ConsoleLogger({ name: '@objectql/core/plugin', level: 'info' });
  }
  
  /**
   * Install the plugin into the kernel
   * This is called during kernel initialization
   */
  async install(ctx: RuntimeContext): Promise<void> {
    this.logger.info('Installing plugin...');
    
    const kernel = ctx.engine as ExtendedKernel;
    
    // Get datasources - either from config or from kernel drivers
    let datasources = this.config.datasources;
    if (!datasources) {
      // Try to get drivers from kernel (micro-kernel pattern)
      const drivers = kernel.getAllDrivers?.();
      if (drivers && drivers.length > 0) {
        datasources = {};
        drivers.forEach((driver: any, index: number) => {
          // Use driver name if available, otherwise use 'default' for first driver
          const driverName = driver.name || (index === 0 ? 'default' : `driver_${index + 1}`);
          datasources![driverName] = driver;
        });
        this.logger.info('Using drivers from kernel', {
          drivers: Object.keys(datasources),
        });
      } else {
        this.logger.warn('No datasources configured and no drivers found in kernel. Repository and QueryService will not be available.');
      }
    }
    
    // Register QueryService and QueryAnalyzer if enabled
    if (this.config.enableQueryService !== false && datasources) {
      const queryService = new QueryService(
        datasources,
        kernel.metadata
      );
      kernel.queryService = queryService;
      
      const queryAnalyzer = new QueryAnalyzer(
        queryService,
        kernel.metadata
      );
      kernel.queryAnalyzer = queryAnalyzer;
      
      this.logger.info('QueryService and QueryAnalyzer registered');
    }
    
    // Register components based on configuration
    if (this.config.enableRepository !== false && datasources) {
      await this.registerRepository(kernel, datasources);
    }
    
    // Install validator plugin if enabled
    if (this.config.enableValidator !== false) {
      const validatorPlugin = new ValidatorPlugin(this.config.validatorConfig || {});
      await validatorPlugin.install?.(ctx);
    }
    
    // Install formula plugin if enabled
    if (this.config.enableFormulas !== false) {
      const formulaPlugin = new FormulaPlugin(this.config.formulaConfig || {});
      await formulaPlugin.install?.(ctx);
    }
    
    if (this.config.enableAI !== false) {
      await this.registerAI(kernel);
    }
    
    // Register system service aliases
    if (typeof (ctx as any).registerService === 'function') {
        const registerService = (ctx as any).registerService.bind(ctx);
        
        // 1. Metadata service
        if (kernel.metadata) {
            registerService('metadata', kernel.metadata);
            this.logger.debug('Registered metadata service alias');
        }
        
        // 2. Data service (prefer QueryService, fallback to kernel)
        const dataService = kernel.queryService || kernel;
        registerService('data', dataService);
        this.logger.debug('Registered data service alias');

        // 3. Analytics service (via QueryService)
        if (kernel.queryService) {
            registerService('analytics', kernel.queryService);
            this.logger.debug('Registered analytics service alias');
        }
    }

    this.logger.info('Plugin installed successfully');
  }
  
  /**
   * Called when the kernel starts
   * This is the initialization phase
   */
  async onStart(ctx: RuntimeContext): Promise<void> {
    this.logger.debug('Starting plugin...');
    // Additional startup logic can be added here
  }

  // --- Adapter for @objectstack/core compatibility ---
  // ---------------------------------------------------
  
  /**
   * Register the Repository pattern
   * @private
   */
  private async registerRepository(kernel: any, datasources: Record<string, Driver>): Promise<void> {
    // Helper function to get the driver for an object
    const getDriver = (objectName: string): Driver => {
      const objectConfig = (kernel as any).metadata.get('object', objectName);
      const datasourceName = objectConfig?.datasource || 'default';
      const driver = datasources[datasourceName];
      if (!driver) {
        throw new Error(`Datasource '${datasourceName}' not found for object '${objectName}'`);
      }
      return driver;
    };

    // Override kernel CRUD methods to use drivers
    kernel.create = async (objectName: string, data: any): Promise<any> => {
      const driver = getDriver(objectName);
      return await driver.create(objectName, data, {});
    };

    kernel.update = async (objectName: string, id: string, data: any): Promise<any> => {
      const driver = getDriver(objectName);
      return await driver.update(objectName, id, data, {});
    };

    kernel.delete = async (objectName: string, id: string): Promise<boolean> => {
      const driver = getDriver(objectName);
      const result = await driver.delete(objectName, id, {});
      return !!result;
    };

    kernel.find = async (objectName: string, query: any): Promise<{ value: any[]; count: number }> => {
      // Use QueryService if available for advanced query processing (AST, optimizations)
      if ((kernel as any).queryService) {
        const result = await (kernel as any).queryService.find(objectName, query);
        return { 
            value: result.value, 
            count: result.count !== undefined ? result.count : result.value.length 
        };
      }

      // Fallback to direct driver call
      const driver = getDriver(objectName);
      const value = await driver.find(objectName, query);
      const count = value.length;
      return { value, count };
    };

    kernel.get = async (objectName: string, id: string): Promise<any> => {
      // Use QueryService if available
      if ((kernel as any).queryService) {
          const result = await (kernel as any).queryService.findOne(objectName, id);
          return result.value;
      }

      const driver = getDriver(objectName);
      return await driver.findOne(objectName, id);
    };

    kernel.count = async (objectName: string, filters?: any): Promise<number> => {
      // Use QueryService if available
      if ((kernel as any).queryService) {
          // QueryService.count expects a UnifiedQuery filter or just filter object?
          // Looking at QueryService.count signature: count(objectName: string, where?: Filter, options?: QueryOptions)
          const result = await (kernel as any).queryService.count(objectName, filters);
          return result.value;
      }

      const driver = getDriver(objectName);
      return await driver.count(objectName, filters || {}, {});
    };

    this.logger.info('Repository pattern registered');
  }
  
  /**
   * Register AI integration
   * @private
   */
  private async registerAI(kernel: any): Promise<void> {
    if (!(kernel as any).ai) {
      (kernel as any).ai = createDefaultAiRegistry();
    }
    this.logger.debug('AI integration registered');
  }

    // --- Adapter for @objectstack/core compatibility ---
    init = async (kernel: any): Promise<void> => {
        // The new core passes the kernel instance directly
        // We wrap it to match the old RuntimeContext interface
        const ctx: any = {
            engine: kernel,
            getKernel: () => kernel
        };

        // Register Protocol Service
        // If kernel supports service registration (PluginContext or ExtendedKernel with custom registry)
        if (kernel && typeof kernel.registerService === 'function') {
            this.logger.info('Registering protocol service...');
            const protocolShim = new ObjectStackProtocolImplementation(kernel);
             kernel.registerService('protocol', protocolShim);
             
             // Register 'objectql' service for AppPlugin compatibility
             kernel.registerService('objectql', this);
             this.logger.debug('Registered objectql service');
        }

        return this.install(ctx);
    }

    start = async (kernel: any): Promise<void> => {
        const ctx: any = {
            engine: kernel,
            getKernel: () => kernel
        };
        return this.onStart(ctx);
    }
}
