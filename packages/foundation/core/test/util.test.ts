/**
 * ObjectQL
 * Copyright (c) 2026-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { toTitleCase, convertIntrospectedSchemaToObjects } from '../src/util';
import { IntrospectedSchema } from '@objectql/types';

describe('Utility Functions', () => {
    describe('toTitleCase', () => {
        it('should convert snake_case to Title Case', () => {
            expect(toTitleCase('hello_world')).toBe('Hello World');
            expect(toTitleCase('first_name')).toBe('First Name');
            expect(toTitleCase('user_id')).toBe('User Id');
        });

        it('should capitalize first letter of each word', () => {
            expect(toTitleCase('hello')).toBe('Hello');
            expect(toTitleCase('test_string')).toBe('Test String');
        });

        it('should handle single word', () => {
            expect(toTitleCase('name')).toBe('Name');
            expect(toTitleCase('id')).toBe('Id');
        });

        it('should handle empty string', () => {
            expect(toTitleCase('')).toBe('');
        });

        it('should handle multiple underscores', () => {
            expect(toTitleCase('first__name')).toBe('First  Name');
        });

        it('should handle strings without underscores', () => {
            expect(toTitleCase('hello')).toBe('Hello');
        });
    });

    describe('convertIntrospectedSchemaToObjects', () => {
        it('should convert simple table to object config', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    users: {
                        name: 'users',
                        columns: [
                            {
                                name: 'name',
                                type: 'VARCHAR',
                                nullable: false,
                                isUnique: false
                            },
                            {
                                name: 'email',
                                type: 'VARCHAR',
                                nullable: false,
                                isUnique: true
                            }
                        ],
                        foreignKeys: [],
                        primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema);

            expect(objects).toHaveLength(1);
            expect(objects[0].name).toBe('users');
            expect(objects[0].label).toBe('Users');
            expect(objects[0].fields?.name).toBeDefined();
            expect(objects[0].fields?.email).toBeDefined();
        });

        it('should skip system columns by default', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    tasks: {
                        name: 'tasks',
                        columns: [
                            { name: 'id', type: 'INTEGER', nullable: false, isUnique: true },
                            { name: 'title', type: 'VARCHAR', nullable: false, isUnique: false },
                            { name: 'created_at', type: 'TIMESTAMP', nullable: true, isUnique: false },
                            { name: 'updated_at', type: 'TIMESTAMP', nullable: true, isUnique: false }
                        ],
                        foreignKeys: [],
                        primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema);

            expect(objects[0].fields?.id).toBeUndefined();
            expect(objects[0].fields?.created_at).toBeUndefined();
            expect(objects[0].fields?.updated_at).toBeUndefined();
            expect(objects[0].fields?.title).toBeDefined();
        });

        it('should include system columns when skipSystemColumns is false', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    tasks: {
                        name: 'tasks',
                        columns: [
                            { name: 'id', type: 'INTEGER', nullable: false, isUnique: true },
                            { name: 'title', type: 'VARCHAR', nullable: false, isUnique: false }
                        ],
                        foreignKeys: [],
                        primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema, {
                skipSystemColumns: false
            });

            expect(objects[0].fields?.id).toBeDefined();
            expect(objects[0].fields?.title).toBeDefined();
        });

        it('should exclude tables in excludeTables list', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    users: {
                        name: 'users',
                        columns: [{ name: 'name', type: 'VARCHAR', nullable: false, isUnique: false }],
                        foreignKeys: [],
                        primaryKeys: ['id']
                    },
                    migrations: {
                        name: 'migrations',
                        columns: [{ name: 'version', type: 'INTEGER', nullable: false, isUnique: false }],
                        foreignKeys: [],
                        primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema, {
                excludeTables: ['migrations']
            });

            expect(objects).toHaveLength(1);
            expect(objects[0].name).toBe('users');
        });

        it('should include only tables in includeTables list', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    users: {

                        name: 'users',

                        columns: [{ name: 'name', type: 'VARCHAR', nullable: false, isUnique: false }],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    },
                    tasks: {

                        name: 'tasks',

                        columns: [{ name: 'title', type: 'VARCHAR', nullable: false, isUnique: false }],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    },
                    logs: {

                        name: 'logs',

                        columns: [{ name: 'message', type: 'TEXT', nullable: false, isUnique: false }],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema, {
                includeTables: ['users', 'tasks']
            });

            expect(objects).toHaveLength(2);
            expect(objects.find(o => o.name === 'users')).toBeDefined();
            expect(objects.find(o => o.name === 'tasks')).toBeDefined();
            expect(objects.find(o => o.name === 'logs')).toBeUndefined();
        });

        it('should map database types to field types correctly', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    test_types: {

                        name: 'test_types',

                        columns: [
                            { name: 'text_field', type: 'VARCHAR', nullable: false, isUnique: false },
                            { name: 'long_text', type: 'TEXT', nullable: false, isUnique: false },
                            { name: 'number_field', type: 'INTEGER', nullable: false, isUnique: false },
                            { name: 'float_field', type: 'FLOAT', nullable: false, isUnique: false },
                            { name: 'bool_field', type: 'BOOLEAN', nullable: false, isUnique: false },
                            { name: 'date_field', type: 'DATE', nullable: false, isUnique: false },
                            { name: 'datetime_field', type: 'TIMESTAMP', nullable: false, isUnique: false },
                            { name: 'json_field', type: 'JSON', nullable: false, isUnique: false }
                        ],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema);
            const fields = objects[0].fields!;

            expect(fields.text_field.type).toBe('text');
            expect(fields.long_text.type).toBe('textarea');
            expect(fields.number_field.type).toBe('number');
            expect(fields.float_field.type).toBe('number');
            expect(fields.bool_field.type).toBe('boolean');
            expect(fields.date_field.type).toBe('date');
            expect(fields.datetime_field.type).toBe('datetime');
            expect(fields.json_field.type).toBe('object');
        });

        it('should set required flag based on nullable', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    test: {

                        name: 'test',

                        columns: [
                            { name: 'required_field', type: 'VARCHAR', nullable: false, isUnique: false },
                            { name: 'optional_field', type: 'VARCHAR', nullable: true, isUnique: false }
                        ],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema);
            const fields = objects[0].fields!;

            expect(fields.required_field.required).toBe(true);
            expect(fields.optional_field.required).toBe(false);
        });

        it('should set unique flag for unique columns', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    test: {

                        name: 'test',

                        columns: [
                            { name: 'email', type: 'VARCHAR', nullable: false, isUnique: true },
                            { name: 'name', type: 'VARCHAR', nullable: false, isUnique: false }
                        ],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema);
            const fields = objects[0].fields!;

            expect(fields.email.unique).toBe(true);
            expect(fields.name.unique).toBeUndefined();
        });

        it('should convert foreign keys to lookup fields', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    tasks: {

                        name: 'tasks',

                        columns: [
                            { name: 'title', type: 'VARCHAR', nullable: false, isUnique: false },
                            { name: 'user_id', type: 'INTEGER', nullable: false, isUnique: false }
                        ],
                        foreignKeys: [
                            {
                                columnName: 'user_id',
                                referencedTable: 'users',
                                referencedColumn: 'id'
                            }
                        ]
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema);
            const fields = objects[0].fields!;

            expect(fields.user_id.type).toBe('lookup');
            expect(fields.user_id.reference_to).toBe('users');
        });

        it('should add max_length for text fields', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    test: {

                        name: 'test',

                        columns: [
                            { 
                                name: 'short_text', 
                                type: 'VARCHAR', 
                                nullable: false, 
                                isUnique: false,
                                maxLength: 100 
                            }
                        ],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema);
            const fields = objects[0].fields!;

            expect(fields.short_text.max_length).toBe(100);
        });

        it('should add default value when present', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    test: {

                        name: 'test',

                        columns: [
                            { 
                                name: 'status', 
                                type: 'VARCHAR', 
                                nullable: false, 
                                isUnique: false,
                                defaultValue: 'active' 
                            }
                        ],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema);
            const fields = objects[0].fields!;

            expect(fields.status.defaultValue).toBe('active');
        });

        it('should handle empty schema', () => {
            const schema: IntrospectedSchema = {
                tables: {}
            };

            const objects = convertIntrospectedSchemaToObjects(schema);
            expect(objects).toHaveLength(0);
        });

        it('should handle multiple tables', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    users: {

                        name: 'users',

                        columns: [{ name: 'name', type: 'VARCHAR', nullable: false, isUnique: false }],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    },
                    tasks: {

                        name: 'tasks',

                        columns: [{ name: 'title', type: 'VARCHAR', nullable: false, isUnique: false }],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    },
                    projects: {

                        name: 'projects',

                        columns: [{ name: 'name', type: 'VARCHAR', nullable: false, isUnique: false }],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema);
            expect(objects).toHaveLength(3);
        });

        it('should map various numeric types', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    numbers: {

                        name: 'numbers',

                        columns: [
                            { name: 'int_field', type: 'INT', nullable: false, isUnique: false },
                            { name: 'bigint_field', type: 'BIGINT', nullable: false, isUnique: false },
                            { name: 'smallint_field', type: 'SMALLINT', nullable: false, isUnique: false },
                            { name: 'decimal_field', type: 'DECIMAL', nullable: false, isUnique: false },
                            { name: 'numeric_field', type: 'NUMERIC', nullable: false, isUnique: false },
                            { name: 'real_field', type: 'REAL', nullable: false, isUnique: false },
                            { name: 'double_field', type: 'DOUBLE PRECISION', nullable: false, isUnique: false }
                        ],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema);
            const fields = objects[0].fields!;

            expect(fields.int_field.type).toBe('number');
            expect(fields.bigint_field.type).toBe('number');
            expect(fields.smallint_field.type).toBe('number');
            expect(fields.decimal_field.type).toBe('number');
            expect(fields.numeric_field.type).toBe('number');
            expect(fields.real_field.type).toBe('number');
            expect(fields.double_field.type).toBe('number');
        });

        it('should map time type correctly', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    times: {

                        name: 'times',

                        columns: [
                            { name: 'time_field', type: 'TIME', nullable: false, isUnique: false }
                        ],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema);
            expect(objects[0].fields?.time_field.type).toBe('time');
        });

        it('should default unknown types to text', () => {
            const schema: IntrospectedSchema = {
                tables: {
                    test: {

                        name: 'test',

                        columns: [
                            { name: 'unknown_field', type: 'CUSTOM_TYPE', nullable: false, isUnique: false }
                        ],
                        foreignKeys: [],
                    primaryKeys: ['id']
                    }
                }
            };

            const objects = convertIntrospectedSchemaToObjects(schema);
            expect(objects[0].fields?.unknown_field.type).toBe('text');
        });
    });
});
