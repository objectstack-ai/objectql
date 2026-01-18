/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { convertIntrospectedSchemaToObjects } from '../src/util';
import { IntrospectedSchema, ObjectConfig } from '@objectql/types';

describe('convertIntrospectedSchemaToObjects', () => {
    it('should convert simple table to object config', () => {
        const introspectedSchema: IntrospectedSchema = {
            tables: {
                users: {
                    name: 'users',
                    columns: [
                        {
                            name: 'id',
                            type: 'varchar',
                            nullable: false,
                            isPrimary: true
                        },
                        {
                            name: 'name',
                            type: 'varchar',
                            nullable: false
                        },
                        {
                            name: 'email',
                            type: 'varchar',
                            nullable: true,
                            isUnique: true
                        },
                        {
                            name: 'age',
                            type: 'integer',
                            nullable: true
                        }
                    ],
                    foreignKeys: [],
                    primaryKeys: ['id']
                }
            }
        };

        const objects = convertIntrospectedSchemaToObjects(introspectedSchema);
        
        expect(objects.length).toBe(1);
        expect(objects[0].name).toBe('users');
        expect(objects[0].label).toBe('Users');
        
        // Check fields (id, created_at, updated_at should be skipped by default)
        expect(objects[0].fields.name).toBeDefined();
        expect(objects[0].fields.name.type).toBe('text');
        expect(objects[0].fields.name.required).toBe(true);
        
        expect(objects[0].fields.email).toBeDefined();
        expect(objects[0].fields.email.unique).toBe(true);
        expect(objects[0].fields.email.required).toBe(false);
        
        expect(objects[0].fields.age).toBeDefined();
        expect(objects[0].fields.age.type).toBe('number');
    });

    it('should convert foreign keys to lookup fields', () => {
        const introspectedSchema: IntrospectedSchema = {
            tables: {
                posts: {
                    name: 'posts',
                    columns: [
                        {
                            name: 'id',
                            type: 'varchar',
                            nullable: false,
                            isPrimary: true
                        },
                        {
                            name: 'title',
                            type: 'varchar',
                            nullable: false
                        },
                        {
                            name: 'author_id',
                            type: 'varchar',
                            nullable: false
                        }
                    ],
                    foreignKeys: [
                        {
                            columnName: 'author_id',
                            referencedTable: 'users',
                            referencedColumn: 'id'
                        }
                    ],
                    primaryKeys: ['id']
                },
                users: {
                    name: 'users',
                    columns: [
                        {
                            name: 'id',
                            type: 'varchar',
                            nullable: false,
                            isPrimary: true
                        },
                        {
                            name: 'name',
                            type: 'varchar',
                            nullable: false
                        }
                    ],
                    foreignKeys: [],
                    primaryKeys: ['id']
                }
            }
        };

        const objects = convertIntrospectedSchemaToObjects(introspectedSchema);
        
        const postsObj = objects.find(o => o.name === 'posts');
        expect(postsObj).toBeDefined();
        
        expect(postsObj!.fields.author_id).toBeDefined();
        expect(postsObj!.fields.author_id.type).toBe('lookup');
        expect(postsObj!.fields.author_id.reference_to).toBe('users');
        expect(postsObj!.fields.author_id.required).toBe(true);
    });

    it('should map database types correctly', () => {
        const introspectedSchema: IntrospectedSchema = {
            tables: {
                types_test: {
                    name: 'types_test',
                    columns: [
                        { name: 'text_field', type: 'text', nullable: true },
                        { name: 'varchar_field', type: 'varchar', nullable: true },
                        { name: 'int_field', type: 'integer', nullable: true },
                        { name: 'bigint_field', type: 'bigint', nullable: true },
                        { name: 'float_field', type: 'float', nullable: true },
                        { name: 'decimal_field', type: 'decimal', nullable: true },
                        { name: 'bool_field', type: 'boolean', nullable: true },
                        { name: 'date_field', type: 'date', nullable: true },
                        { name: 'datetime_field', type: 'datetime', nullable: true },
                        { name: 'timestamp_field', type: 'timestamp', nullable: true },
                        { name: 'json_field', type: 'json', nullable: true }
                    ],
                    foreignKeys: [],
                    primaryKeys: []
                }
            }
        };

        const objects = convertIntrospectedSchemaToObjects(introspectedSchema);
        const obj = objects[0];
        
        expect(obj.fields.text_field.type).toBe('textarea');
        expect(obj.fields.varchar_field.type).toBe('text');
        expect(obj.fields.int_field.type).toBe('number');
        expect(obj.fields.bigint_field.type).toBe('number');
        expect(obj.fields.float_field.type).toBe('number');
        expect(obj.fields.decimal_field.type).toBe('number');
        expect(obj.fields.bool_field.type).toBe('boolean');
        expect(obj.fields.date_field.type).toBe('date');
        expect(obj.fields.datetime_field.type).toBe('datetime');
        expect(obj.fields.timestamp_field.type).toBe('datetime');
        expect(obj.fields.json_field.type).toBe('object');
    });

    it('should exclude tables based on options', () => {
        const introspectedSchema: IntrospectedSchema = {
            tables: {
                users: {
                    name: 'users',
                    columns: [
                        { name: 'id', type: 'varchar', nullable: false, isPrimary: true },
                        { name: 'name', type: 'varchar', nullable: false }
                    ],
                    foreignKeys: [],
                    primaryKeys: ['id']
                },
                sessions: {
                    name: 'sessions',
                    columns: [
                        { name: 'id', type: 'varchar', nullable: false, isPrimary: true },
                        { name: 'token', type: 'varchar', nullable: false }
                    ],
                    foreignKeys: [],
                    primaryKeys: ['id']
                }
            }
        };

        const objects = convertIntrospectedSchemaToObjects(introspectedSchema, {
            excludeTables: ['sessions']
        });
        
        expect(objects.length).toBe(1);
        expect(objects[0].name).toBe('users');
    });

    it('should include only specified tables', () => {
        const introspectedSchema: IntrospectedSchema = {
            tables: {
                users: {
                    name: 'users',
                    columns: [
                        { name: 'id', type: 'varchar', nullable: false, isPrimary: true },
                        { name: 'name', type: 'varchar', nullable: false }
                    ],
                    foreignKeys: [],
                    primaryKeys: ['id']
                },
                posts: {
                    name: 'posts',
                    columns: [
                        { name: 'id', type: 'varchar', nullable: false, isPrimary: true },
                        { name: 'title', type: 'varchar', nullable: false }
                    ],
                    foreignKeys: [],
                    primaryKeys: ['id']
                },
                sessions: {
                    name: 'sessions',
                    columns: [
                        { name: 'id', type: 'varchar', nullable: false, isPrimary: true }
                    ],
                    foreignKeys: [],
                    primaryKeys: ['id']
                }
            }
        };

        const objects = convertIntrospectedSchemaToObjects(introspectedSchema, {
            includeTables: ['users', 'posts']
        });
        
        expect(objects.length).toBe(2);
        expect(objects.map(o => o.name)).toContain('users');
        expect(objects.map(o => o.name)).toContain('posts');
        expect(objects.map(o => o.name)).not.toContain('sessions');
    });

    it('should skip system columns by default', () => {
        const introspectedSchema: IntrospectedSchema = {
            tables: {
                users: {
                    name: 'users',
                    columns: [
                        { name: 'id', type: 'varchar', nullable: false, isPrimary: true },
                        { name: 'name', type: 'varchar', nullable: false },
                        { name: 'created_at', type: 'timestamp', nullable: true },
                        { name: 'updated_at', type: 'timestamp', nullable: true }
                    ],
                    foreignKeys: [],
                    primaryKeys: ['id']
                }
            }
        };

        const objects = convertIntrospectedSchemaToObjects(introspectedSchema);
        
        // System columns should be skipped
        expect(objects[0].fields.id).toBeUndefined();
        expect(objects[0].fields.created_at).toBeUndefined();
        expect(objects[0].fields.updated_at).toBeUndefined();
        
        // But regular columns should be present
        expect(objects[0].fields.name).toBeDefined();
    });

    it('should include system columns when skipSystemColumns is false', () => {
        const introspectedSchema: IntrospectedSchema = {
            tables: {
                users: {
                    name: 'users',
                    columns: [
                        { name: 'id', type: 'varchar', nullable: false, isPrimary: true },
                        { name: 'name', type: 'varchar', nullable: false },
                        { name: 'created_at', type: 'timestamp', nullable: true }
                    ],
                    foreignKeys: [],
                    primaryKeys: ['id']
                }
            }
        };

        const objects = convertIntrospectedSchemaToObjects(introspectedSchema, {
            skipSystemColumns: false
        });
        
        // System columns should be included
        expect(objects[0].fields.id).toBeDefined();
        expect(objects[0].fields.created_at).toBeDefined();
    });
});
