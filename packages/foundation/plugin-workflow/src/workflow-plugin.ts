/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Workflow Plugin
 * 
 * RuntimePlugin implementation that registers beforeUpdate hooks
 * to intercept state field changes and execute state machine logic.
 */

import type { RuntimePlugin, RuntimeContext, StateMachineConfig } from '@objectql/types';
import { ObjectQLError, ConsoleLogger, type Logger } from '@objectql/types';
import type { ExecutionContext, WorkflowInstance } from './types';
import { StateMachineEngine } from './engine/state-machine-engine';
import { GuardEvaluator, type GuardResolver } from './engine/guard-evaluator';
import { ActionExecutor, type ActionExecutorFn } from './engine/action-executor';

/**
 * Workflow Plugin Configuration
 */
export interface WorkflowPluginConfig {
  /** Enable audit trail persistence. Default: false */
  enableAuditTrail?: boolean;

  /** Custom guard resolver — for guards that need external data. Default: built-in */
  guardResolver?: GuardResolver;

  /** Custom action executor — for actions that trigger external systems. Default: built-in */
  actionExecutor?: ActionExecutorFn;
}

/**
 * Extended kernel interface
 */
interface KernelWithWorkflow {
  workflowEngine?: WorkflowPlugin;
  metadata?: any;
  hooks?: any;
}

/**
 * Workflow Plugin
 */
export class WorkflowPlugin implements RuntimePlugin {
  name = '@objectql/plugin-workflow';
  version = '4.2.0';

  private config: WorkflowPluginConfig;
  private logger: Logger;
  private kernel: any;
  private engines: Map<string, StateMachineEngine> = new Map();
  private guardEvaluator: GuardEvaluator;
  private actionExecutor: ActionExecutor;
  private auditTrail: WorkflowInstance[] = [];

  constructor(config: WorkflowPluginConfig = {}) {
    this.config = {
      enableAuditTrail: config.enableAuditTrail ?? false,
      guardResolver: config.guardResolver,
      actionExecutor: config.actionExecutor,
    };

    this.logger = new ConsoleLogger({ name: this.name, level: 'info' });
    this.guardEvaluator = new GuardEvaluator(this.config.guardResolver);
    this.actionExecutor = new ActionExecutor(this.config.actionExecutor);
  }

  /**
   * Install the plugin into the kernel
   */
  async install(ctx: RuntimeContext | any): Promise<void> {
    // Detect kernel
    const kernel = (ctx.engine || (ctx.getKernel && ctx.getKernel()) || ctx) as KernelWithWorkflow;
    this.kernel = kernel;

    this.logger.info('Installing workflow plugin', {
      config: {
        enableAuditTrail: this.config.enableAuditTrail,
      },
    });

    // Make workflow engine accessible from kernel
    kernel.workflowEngine = this;

    // Register beforeUpdate hook for state machine validation
    this.registerStateTransitionHook(kernel, ctx);

    this.logger.info('Workflow plugin installed successfully');
  }

  /**
   * Adapter for @objectstack/core compatibility
   */
  async init(ctx: any): Promise<void> {
    return this.install(ctx);
  }

  async start(ctx: any): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Register state transition hook
   */
  private registerStateTransitionHook(kernel: KernelWithWorkflow, ctx: any): void {
    const registerHook = (name: string, handler: any) => {
      if (typeof ctx.hook === 'function') {
        ctx.hook(name, handler);
      } else if (kernel.hooks && typeof kernel.hooks.register === 'function') {
        kernel.hooks.register(name, '*', handler);
      }
    };

    const handler = async (context: any) => {
      const { objectName, data, previousData, operation, api, user } = context;

      // Only handle updates
      if (operation !== 'update' || !previousData) {
        return;
      }

      // Get schema from kernel metadata
      const schemaItem = this.kernel.metadata?.get('object', objectName);
      const schema = schemaItem?.content || schemaItem;

      if (!schema) return;

      // Check if object has state machine configuration
      const stateMachineConfig = schema.stateMachine || schema.stateMachines;
      if (!stateMachineConfig) return;

      // Handle single state machine or multiple state machines
      const stateMachines = schema.stateMachine
        ? { default: schema.stateMachine }
        : schema.stateMachines || {};

      // Process each state machine
      for (const [machineName, machineConfig] of Object.entries(stateMachines)) {
        await this.processStateMachine(
          machineName,
          machineConfig as StateMachineConfig,
          {
            objectName,
            record: data,
            previousRecord: previousData,
            operation,
            user,
            api,
          }
        );
      }
    };

    registerHook('beforeUpdate', handler);
  }

  /**
   * Process state machine transitions
   */
  private async processStateMachine(
    machineName: string,
    config: StateMachineConfig,
    context: {
      objectName: string;
      record: Record<string, any>;
      previousRecord: Record<string, any>;
      operation: string;
      user?: any;
      api?: any;
    }
  ): Promise<void> {
    // Get or create engine for this state machine
    const engineKey = `${context.objectName}:${machineName}`;
    let engine = this.engines.get(engineKey);

    if (!engine) {
      // Validate configuration
      const validation = StateMachineEngine.validate(config);
      if (!validation.valid) {
        throw new ObjectQLError({
          code: 'INVALID_STATE_MACHINE',
          message: `State machine configuration is invalid: ${validation.errors.join(', ')}`,
        });
      }

      engine = new StateMachineEngine(config, this.guardEvaluator, this.actionExecutor);
      this.engines.set(engineKey, engine);
    }

    // Determine the state field
    // Convention: if config has a 'context' with 'stateField', use it
    // Otherwise, look for a field named 'status' or 'state'
    const stateField = this.determineStateField(config, context.record);

    if (!stateField) {
      // No state field in this update, skip
      return;
    }

    const oldState = context.previousRecord[stateField];
    const newState = context.record[stateField];

    // If state hasn't changed, skip
    if (oldState === newState) {
      return;
    }

    // Attempt the transition
    const executionContext: ExecutionContext = {
      record: context.record,
      previousRecord: context.previousRecord,
      operation: context.operation as any,
      user: context.user,
      api: context.api,
    };

    const result = await engine.transition(oldState, newState, executionContext);

    if (!result.allowed) {
      throw new ObjectQLError({
        code: result.errorCode || 'TRANSITION_DENIED',
        message: result.error || `State transition from "${oldState}" to "${newState}" is not allowed`,
        details: result.metadata,
      });
    }

    // Update the record with the resolved target state
    if (result.targetState && result.targetState !== newState) {
      context.record[stateField] = result.targetState;
    }

    // Record audit trail if enabled
    if (this.config.enableAuditTrail) {
      this.recordAuditTrail({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        objectName: context.objectName,
        recordId: context.record.id || context.record._id || '',
        stateMachineName: machineName,
        currentState: result.targetState || newState,
        previousState: oldState,
        timestamp: new Date().toISOString(),
        userId: context.user?.id,
        actionsExecuted: result.actions,
        metadata: result.metadata,
      });
    }
  }

  /**
   * Determine which field holds the state
   */
  private determineStateField(
    config: StateMachineConfig,
    record: Record<string, any>
  ): string | undefined {
    // Check if config specifies a state field
    if ((config as any).stateField) {
      return (config as any).stateField;
    }

    // Check common field names
    const commonFields = ['status', 'state', 'workflow_state'];
    for (const field of commonFields) {
      if (field in record) {
        return field;
      }
    }

    return undefined;
  }

  /**
   * Record audit trail entry
   */
  private recordAuditTrail(instance: WorkflowInstance): void {
    this.auditTrail.push(instance);

    // In production, this would persist to a database
    // For now, keep in memory with a maximum size
    if (this.auditTrail.length > 10000) {
      this.auditTrail = this.auditTrail.slice(-5000);
    }
  }

  /**
   * Get audit trail
   */
  getAuditTrail(filters?: {
    objectName?: string;
    recordId?: string;
    stateMachineName?: string;
  }): WorkflowInstance[] {
    if (!filters) {
      return [...this.auditTrail];
    }

    return this.auditTrail.filter(entry => {
      if (filters.objectName && entry.objectName !== filters.objectName) return false;
      if (filters.recordId && entry.recordId !== filters.recordId) return false;
      if (filters.stateMachineName && entry.stateMachineName !== filters.stateMachineName) return false;
      return true;
    });
  }

  /**
   * Get a state machine engine for direct access
   */
  getEngine(objectName: string, machineName: string = 'default'): StateMachineEngine | undefined {
    const engineKey = `${objectName}:${machineName}`;
    return this.engines.get(engineKey);
  }

  /**
   * Clear engines cache (useful for testing)
   */
  clearEngines(): void {
    this.engines.clear();
  }

  /**
   * Clear audit trail
   */
  clearAuditTrail(): void {
    this.auditTrail = [];
  }
}
