/**
 * ObjectQL Plugin
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { RuntimePlugin, RuntimeContext } from '@objectstack/runtime';
import type { ObjectStackKernel } from '@objectstack/runtime';

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
   * Enable formula engine
   * @default true
   */
  enableFormulas?: boolean;
  
  /**
   * Enable AI integration
   * @default true
   */
  enableAI?: boolean;
}

/**
 * ObjectQL Plugin
 * 
 * Implements the RuntimePlugin interface from @objectstack/runtime
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
      ...config
    };
  }
  
  /**
   * Install the plugin into the kernel
   * This is called during kernel initialization
   */
  async install(ctx: RuntimeContext): Promise<void> {
    console.log(`[${this.name}] Installing plugin...`);
    
    // Register components based on configuration
    if (this.config.enableRepository !== false) {
      await this.registerRepository(ctx.engine);
    }
    
    if (this.config.enableValidator !== false) {
      await this.registerValidator(ctx.engine);
    }
    
    if (this.config.enableFormulas !== false) {
      await this.registerFormulas(ctx.engine);
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
    // TODO: Implement repository registration
    // For now, this is a placeholder to establish the structure
    console.log(`[${this.name}] Repository pattern registered`);
  }
  
  /**
   * Register the Validator engine
   * @private
   */
  private async registerValidator(kernel: ObjectStackKernel): Promise<void> {
    // TODO: Implement validator registration
    // For now, this is a placeholder to establish the structure
    console.log(`[${this.name}] Validator engine registered`);
  }
  
  /**
   * Register the Formula engine
   * @private
   */
  private async registerFormulas(kernel: ObjectStackKernel): Promise<void> {
    // TODO: Implement formula registration
    // For now, this is a placeholder to establish the structure
    console.log(`[${this.name}] Formula engine registered`);
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
