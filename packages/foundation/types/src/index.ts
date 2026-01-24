/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Export our runtime types.
 * 
 * These modules import and extend types from @objectstack/spec where needed.
 * Users of @objectql/types should import from here to get both protocol types
 * and runtime extensions.
 */
export * from './field';
export * from './object';
export * from './driver';
export * from './query';
export * from './registry';
export * from './hook';
export * from './action';
export * from './repository';
export * from './app';
export * from './config';
export * from './context';
export * from './validation';
export * from './permission';
export * from './page';
export * from './loader';
export * from './application';
export * from './menu';
export * from './migration';
export * from './api';
export * from './view';
export * from './workflow';
export * from './report';
export * from './form';
export * from './formula';

/**
 * Trigger schemas from @objectstack/spec
 * 
 * Re-exports trigger validation schemas directly from the protocol specification.
 */
import { Data } from '@objectstack/spec';

export const TriggerAction = Data.TriggerAction;
export const TriggerTiming = Data.TriggerTiming;
export const TriggerContextSchema = Data.TriggerContextSchema;
export const TriggerSchema = Data.TriggerSchema;

export type TriggerActionType = Data.TriggerAction;
export type TriggerTimingType = Data.TriggerTiming;
export type TriggerContext = Data.TriggerContext;
export type Trigger = Data.Trigger;
