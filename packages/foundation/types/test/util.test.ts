/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { resolveI18nLabel } from '../src/util';

describe('resolveI18nLabel', () => {
    it('should return undefined for undefined input', () => {
        expect(resolveI18nLabel(undefined)).toBeUndefined();
    });

    it('should return undefined for null input', () => {
        expect(resolveI18nLabel(null)).toBeUndefined();
    });

    it('should return the string as-is for plain string input', () => {
        expect(resolveI18nLabel('Hello')).toBe('Hello');
    });

    it('should return empty string for empty string input', () => {
        expect(resolveI18nLabel('')).toBe('');
    });

    it('should return defaultValue from i18n object when available', () => {
        expect(resolveI18nLabel({
            key: 'views.task_list.label',
            defaultValue: 'Task List',
        })).toBe('Task List');
    });

    it('should return key as fallback when defaultValue is not provided', () => {
        expect(resolveI18nLabel({
            key: 'views.task_list.label',
        })).toBe('views.task_list.label');
    });

    it('should return key as fallback when defaultValue is empty string', () => {
        expect(resolveI18nLabel({
            key: 'views.task_list.label',
            defaultValue: '',
        })).toBe('views.task_list.label');
    });

    it('should handle i18n object with params', () => {
        expect(resolveI18nLabel({
            key: 'items.count',
            defaultValue: '{count} items',
            params: { count: 5 },
        })).toBe('{count} items');
    });
});
