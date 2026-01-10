import { Driver } from '@objectql/core';
import knex, { Knex } from 'knex';

export class KnexDriver implements Driver {
    private knex: Knex;
    private config: any;
    private jsonFields: Record<string, string[]> = {};

    constructor(config: any) {
        this.config = config;
        this.knex = knex(config);
    }

    private getBuilder(objectName: string, options?: any) {
        let builder = this.knex(objectName);
        if (options?.transaction) {
            builder = builder.transacting(options.transaction);
        }
        return builder;
    }

    private applyFilters(builder: Knex.QueryBuilder, filters: any) {
        if (!filters || filters.length === 0) return;

        let nextJoin = 'and';

        for (const item of filters) {
             if (typeof item === 'string') {
                 if (item.toLowerCase() === 'or') nextJoin = 'or';
                 else if (item.toLowerCase() === 'and') nextJoin = 'and';
                 continue;
             }

             if (Array.isArray(item)) {
                 // Heuristic to detect if it is a criterion [field, op, value] or a nested group
                 const [fieldRaw, op, value] = item;
                 const isCriterion = typeof fieldRaw === 'string' && typeof op === 'string';

                 if (isCriterion) {
                     const field = this.mapSortField(fieldRaw);
                     // Handle specific operators that map to different knex methods
                     const apply = (b: any) => {
                         let method = nextJoin === 'or' ? 'orWhere' : 'where';
                         let methodIn = nextJoin === 'or' ? 'orWhereIn' : 'whereIn';
                         let methodNotIn = nextJoin === 'or' ? 'orWhereNotIn' : 'whereNotIn';
                         
                         // Fix for 'contains' mapping
                         if (op === 'contains') {
                             b[method](field, 'like', `%${value}%`);
                             return;
                         }

                         switch (op) {
                             case '=': b[method](field, value); break;
                             case '!=': b[method](field, '<>', value); break;
                             case 'in': b[methodIn](field, value); break;
                             case 'nin': b[methodNotIn](field, value); break;
                             default: b[method](field, op, value);
                         }
                     };
                     apply(builder);
                 } else {
                     // Recursive Group
                     const method = nextJoin === 'or' ? 'orWhere' : 'where';
                     builder[method]((qb) => {
                         this.applyFilters(qb, item);
                     });
                 }
                 
                 nextJoin = 'and'; 
             }
        }
    }

    private mapSortField(field: string): string {
        if (field === 'createdAt') return 'created_at';
        if (field === 'updatedAt') return 'updated_at';
        return field;
    }

    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        const builder = this.getBuilder(objectName, options);
        
        if (query.fields) {
            builder.select(query.fields.map((f: string) => this.mapSortField(f)));
        } else {
            builder.select('*');
        }

        if (query.filters) {
            this.applyFilters(builder, query.filters);
        }

        if (query.sort) {
            for (const [field, dir] of query.sort) {
                builder.orderBy(this.mapSortField(field), dir);
            }
        }

        if (query.skip) builder.offset(query.skip);
        if (query.limit) builder.limit(query.limit);

        const results = await builder;
        if (this.config.client === 'sqlite3') {
             for (const row of results) {
                 this.formatOutput(objectName, row);
             }
        }
        return results;
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any) {
        if (id) {
            const res = await this.getBuilder(objectName, options).where('id', id).first();
            return this.formatOutput(objectName, res);
        }
        if (query) {
             const results = await this.find(objectName, { ...query, limit: 1 }, options);
             return results[0];
        }
        return null;
    }

    async create(objectName: string, data: any, options?: any) {
        // Handle _id -> id mapping for compatibility
        const { _id, ...rest } = data;
        const toInsert = { ...rest };
        // If _id exists and id doesn't, map _id to id
        if (_id !== undefined && toInsert.id === undefined) {
             toInsert.id = _id;
        } else if (toInsert.id !== undefined) {
            // normal case
        }
        
        // Knex insert returns Result array (e.g. ids)
        // We want the created document. 
        const builder = this.getBuilder(objectName, options);

        const formatted = this.formatInput(objectName, toInsert);

        // We should insert 'toInsert' instead of 'data'
        const result = await builder.insert(formatted).returning('*'); 
        return this.formatOutput(objectName, result[0]);
    }

    async update(objectName: string, id: string | number, data: any, options?: any) {
        const builder = this.getBuilder(objectName, options);
        const formatted = this.formatInput(objectName, data);
        await builder.where('id', id).update(formatted);
        return { id, ...data }; 
    }

    async delete(objectName: string, id: string | number, options?: any) {
        const builder = this.getBuilder(objectName, options);
        return await builder.where('id', id).delete();
    }

    async count(objectName: string, filters: any, options?: any): Promise<number> {
        const builder = this.getBuilder(objectName, options);
        if (filters) {
            this.applyFilters(builder, filters);
        }
        const result = await builder.count<{count: number}[]>('* as count');
        // result is usually [{count: 123}] or similar depending on driver
        if (result && result.length > 0) {
            const row: any = result[0];
            return Number(row.count || row['count(*)']);
        }
        return 0;
    }

    // Transaction Support
    async beginTransaction(): Promise<any> {
        return await this.knex.transaction();
    }

    async commitTransaction(trx: Knex.Transaction): Promise<void> {
        await trx.commit();
    }

    async rollbackTransaction(trx: Knex.Transaction): Promise<void> {
        await trx.rollback();
    }
    
    // Bulk
    async createMany(objectName: string, data: any[], options?: any): Promise<any> {
        const builder = this.getBuilder(objectName, options);
        return await builder.insert(data).returning('*');
    }
    
    async updateMany(objectName: string, filters: any, data: any, options?: any): Promise<any> {
        const builder = this.getBuilder(objectName, options);
        if(filters) this.applyFilters(builder, filters);
        return await builder.update(data);
    }
    
    async deleteMany(objectName: string, filters: any, options?: any): Promise<any> {
        const builder = this.getBuilder(objectName, options);
        if(filters) this.applyFilters(builder, filters);
        return await builder.delete();
    }

    async init(objects: any[]): Promise<void> {
        await this.ensureDatabaseExists();

        for (const obj of objects) {
            const tableName = obj.name;
            
            // Cache JSON fields
            const jsonCols: string[] = [];
            if (obj.fields) {
                for (const [name, field] of Object.entries<any>(obj.fields)) {
                     const type = field.type || 'string';
                     if (this.isJsonField(type, field)) {
                         jsonCols.push(name);
                     }
                }
            }
            this.jsonFields[tableName] = jsonCols;

            let exists = await this.knex.schema.hasTable(tableName);
            
            if (exists) {
                 const columnInfo = await this.knex(tableName).columnInfo();
                 const existingColumns = Object.keys(columnInfo);
                 
                 // Check for _id vs id conflict (Legacy _id from mongo-style init)
                 if (existingColumns.includes('_id') && !existingColumns.includes('id')) {
                     console.log(`[KnexDriver] Detected legacy '_id' in '${tableName}'. Recreating table for 'id' compatibility...`);
                     await this.knex.schema.dropTable(tableName);
                     exists = false;
                 }
            }
            
            if (!exists) {
                await this.knex.schema.createTable(tableName, (table) => {
                    // Use standard 'id' for SQL databases
                    table.string('id').primary(); 
                    table.timestamp('created_at').defaultTo(this.knex.fn.now());
                    table.timestamp('updated_at').defaultTo(this.knex.fn.now());
                    if (obj.fields) {
                        for (const [name, field] of Object.entries(obj.fields)) {
                            this.createColumn(table, name, field);
                        }
                    }
                });
                console.log(`[KnexDriver] Created table '${tableName}'`);
            } else {
                 const columnInfo = await this.knex(tableName).columnInfo();
                 const existingColumns = Object.keys(columnInfo);
                 
                 await this.knex.schema.alterTable(tableName, (table) => {
                     if (obj.fields) {
                         for (const [name, field] of Object.entries(obj.fields)) {
                             if (!existingColumns.includes(name)) {
                                 this.createColumn(table, name, field);
                                 console.log(`[KnexDriver] Added column '${name}' to '${tableName}'`);
                             }
                         }
                     }
                 });
            }
        }
    }

    private createColumn(table: Knex.CreateTableBuilder, name: string, field: any) {
        if (field.multiple) {
            table.json(name);
            return;
        }

        const type = field.type || 'string';
        let col;
        switch(type) {
            case 'string': 
            case 'email':
            case 'url':
            case 'phone':
            case 'password':
                col = table.string(name); break;
            case 'text': 
            case 'textarea': 
            case 'html': 
            case 'markdown':
                col = table.text(name); break;
            case 'integer': 
            case 'int': col = table.integer(name); break;
            case 'float': 
            case 'number': 
            case 'currency':
            case 'percent': col = table.float(name); break;
            case 'boolean': col = table.boolean(name); break;
            case 'date': col = table.date(name); break;
            case 'datetime': col = table.timestamp(name); break;
            case 'time': col = table.time(name); break;
            case 'json': 
            case 'object':
            case 'array': 
            case 'image':
            case 'file':
            case 'avatar':
            case 'location': col = table.json(name); break;
            case 'summary': col = table.float(name); break; // Stored calculation result
            case 'auto_number': col = table.string(name); break; // Generated string
            case 'formula': return; // Virtual field, do not create column
            default: col = table.string(name);
        }

        if (field.unique) {
            col.unique();
        }
        if (field.required) {
            col.notNullable();
        }
    }

    private async ensureDatabaseExists() {
        if (this.config.client !== 'pg' && this.config.client !== 'postgresql') return;
        
        try {
            await this.knex.raw('SELECT 1');
        } catch (e: any) {
            if (e.code === '3D000') { // Database does not exist
                 await this.createDatabase();
            } else {
                throw e;
            }
        }
    }

    private async createDatabase() {
        const config = this.config;
        const connection = config.connection;
        let dbName = '';
        let adminConfig = { ...config };

        if (typeof connection === 'string') {
            const url = new URL(connection);
            dbName = url.pathname.slice(1);
            url.pathname = '/postgres';
            adminConfig.connection = url.toString();
        } else {
            dbName = connection.database;
            adminConfig.connection = { ...connection, database: 'postgres' };
        }

        console.log(`[KnexDriver] Database '${dbName}' does not exist. Creating...`);

        const adminKnex = knex(adminConfig);
        try {
            await adminKnex.raw(`CREATE DATABASE "${dbName}"`);
            console.log(`[KnexDriver] Database '${dbName}' created successfully.`);
        } catch (e: any) {
             console.error(`[KnexDriver] Failed to create database '${dbName}':`, e.message);
             if (e.code === '42501') {
                 console.error(`[KnexDriver] Hint: The user '${adminConfig.connection.user || 'current user'}' does not have CREATEDB privileges.`);
                 console.error(`[KnexDriver] Please run: createdb ${dbName}`);
             }
             throw e;
        } finally {
            await adminKnex.destroy();
        }
    }

    private isJsonField(type: string, field: any) {
        return ['json', 'object', 'array', 'image', 'file', 'avatar', 'location'].includes(type) || field.multiple;
    }

    private formatInput(objectName: string, data: any) {
        // Only needed for SQLite usually, PG handles JSON
        const isSqlite = this.config.client === 'sqlite3';
        if (!isSqlite) return data;
        
        const fields = this.jsonFields[objectName];
        if (!fields || fields.length === 0) return data;

        const copy = { ...data };
        for (const field of fields) {
            if (copy[field] !== undefined && typeof copy[field] === 'object' && copy[field] !== null) {
                copy[field] = JSON.stringify(copy[field]);
            }
        }
        return copy;
    }

    private formatOutput(objectName: string, data: any) {
        const isSqlite = this.config.client === 'sqlite3';
        if (!isSqlite) return data;

        const fields = this.jsonFields[objectName];
        if (!fields || fields.length === 0) return data;

        // data is a single row object
        for (const field of fields) {
            if (data[field] !== undefined && typeof data[field] === 'string') {
                try {
                    data[field] = JSON.parse(data[field]);
                } catch (e) {
                    // ignore parse error, keep as string
                }
            }
        }
        return data;
    }
}

