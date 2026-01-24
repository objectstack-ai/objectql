/**
 * ObjectQL Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectql/runtime';
import type { ObjectStackKernel } from '@objectql/runtime';
import { ValidatorPlugin, ValidatorPluginConfig } from './validator-plugin';
import { FormulaPlugin, FormulaPluginConfig } from './formula-plugin';
import { QueryService } from './query/query-service';
import { QueryAnalyzer } from './query/query-analyzer';
import type { Driver } from '@objectql/types';

/**
 * Extended ObjectStack Kernel with ObjectQL services
 */
interface ExtendedKernel extends ObjectStackKernel {
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
 * Implements the RuntimePlugin interface from @objectql/runtime
 * to provide ObjectQL's enhanced features (Repository, Validator, Formula, AI)
 * on top of the ObjectStack kernel.
 */
export class ObjectQLPlugin implements RuntimePlugin {
  name = '@objectql/core';
  version = '4.0.0';
  
  constructor(private config: ObjectQLPluginConfig = {}) {
    // Set defaults
    this.config = {
      enableRepository: true,
      enableValidator: true,
      enableFormulas: true,
      enableAI: true,
      enableQueryService: true,
      ...config
    };
  }
  
  /**
   * Install the plugin into the kernel
   * This is called during kernel initialization
   */
  async install(ctx: RuntimeContext): Promise<void> {
    console.log(`[${this.name}] Installing plugin...`);
    
    const kernel = ctx.engine as ExtendedKernel;
    
    // Register QueryService and QueryAnalyzer if enabled
    if (this.config.enableQueryService !== false && this.config.datasources) {
      const queryService = new QueryService(
        this.config.datasources,
        kernel.metadata
      );
      kernel.queryService = queryService;
      
      const queryAnalyzer = new QueryAnalyzer(
        queryService,
        kernel.metadata
      );
      kernel.queryAnalyzer = queryAnalyzer;
      
      console.log(`[${this.name}] QueryService and QueryAnalyzer registered`);
    }
    
    // Register components based on configuration
    if (this.config.enableRepository !== false) {
      await this.registerRepository(ctx.engine);
    }
    
    // Install validator plugin if enabled
    if (this.config.enableValidator !== false) {
      const validatorPlugin = new ValidatorPlugin(this.config.validatorConfig || {});
      await validatorPlugin.install(ctx);
    }
    
    // Install formula plugin if enabled
    if (this.config.enableFormulas !== false) {
      const formulaPlugin = new FormulaPlugin(this.config.formulaConfig || {});
      await formulaPlugin.install(ctx);
    }
    
    if (this.config.enableAI !== false) {
      await this.registerAI(ctx.engine);
    }
    
    console.log(`[${this.name}] Plugin installed successfully`);
  }
  
  /**
   * Called when the kernel starts
   * This is the initialization phase
   */
  async onStart(ctx: RuntimeContext): Promise<void> {
    console.log(`[${this.name}] Starting plugin...`);
    // Additional startup logic can be added here
  }
  
  /**
   * Register the Repository pattern
   * @private
   */
  private async registerRepository(kernel: ObjectStackKernel): Promise<void> {
    if (!this.config.datasources) {
      console.log(`[${this.name}] No datasources configured, skipping repository registration`);
      return;
    }

    const datasources = this.config.datasources;

    // Helper function to get the driver for an object
    const getDriver = (objectName: string): Driver => {
      const objectConfig = kernel.metadata.get<any>('object', objectName);
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
      return await driver.create(objectName, data);
    };

    kernel.update = async (objectName: string, id: string, data: any): Promise<any> => {
      const driver = getDriver(objectName);
      return await driver.update(objectName, id, data);
    };

    kernel.delete = async (objectName: string, id: string): Promise<boolean> => {
      const driver = getDriver(objectName);
      const result = await driver.delete(objectName, id);
      return !!result;
    };

    kernel.find = async (objectName: string, query: any): Promise<{ value: any[]; count: number }> => {
      const driver = getDriver(objectName);
      const value = await driver.find(objectName, query);
      const count = value.length;
      return { value, count };
    };

    kernel.get = async (objectName: string, id: string): Promise<any> => {
      const driver = getDriver(objectName);
      return await driver.findOne(objectName, id);
    };

    console.log(`[${this.name}] Repository pattern registered`);
  }
  
  /**
   * Register AI integration
   * @private
   */
  private async registerAI(kernel: ObjectStackKernel): Promise<void> {
    // TODO: Implement AI registration
    // For now, this is a placeholder to establish the structure
    console.log(`[${this.name}] AI integration registered`);
  }
}
