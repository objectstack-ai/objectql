/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Trigger Zod Schemas
 * 
 * Re-exports trigger validation schemas from @objectstack/spec protocol.
 * These schemas define the structure for database triggers that execute
 * before or after insert, update, or delete operations.
 * 
 * @see https://github.com/objectstack-ai/spec for the full protocol specification
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
