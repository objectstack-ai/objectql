import { KnexDriver } from '../src';

describe('KnexDriver Schema Sync (SQLite)', () => {
    let driver: KnexDriver;
    let knexInstance: any;

    beforeEach(async () => {
        // Init ephemeral in-memory database
        driver = new KnexDriver({
            client: 'sqlite3',
            connection: {
                filename: ':memory:'
            },
            useNullAsDefault: true
        });
        knexInstance = (driver as any).knex;
    });

    afterEach(async () => {
        await knexInstance.destroy();
    });

    it('should create table if not exists', async () => {
        const objects = [{
            name: 'test_obj',
            fields: {
                name: { type: 'string' },
                age: { type: 'integer' }
            }
        }];

        await driver.init(objects);

        const exists = await knexInstance.schema.hasTable('test_obj');
        expect(exists).toBe(true);

        const columns = await knexInstance('test_obj').columnInfo();
        expect(columns).toHaveProperty('id');
        expect(columns).toHaveProperty('created_at');
        expect(columns).toHaveProperty('updated_at');
        expect(columns).toHaveProperty('name');
        expect(columns).toHaveProperty('age');
    });

    it('should add new columns if table exists', async () => {
        // 1. Setup existing table with subset of columns
        await knexInstance.schema.createTable('test_obj', (t: any) => {
            t.string('id').primary();
            t.string('name');
        });

        // 2. Insert some data
        await knexInstance('test_obj').insert({ id: '1', name: 'Old Data' });

        // 3. Init with new fields
        const objects = [{
            name: 'test_obj',
            fields: {
                name: { type: 'string' },
                age: { type: 'integer' }, // New field
                active: { type: 'boolean' } // New field
            }
        }];

        await driver.init(objects);

        // 4. Verify columns
        const columns = await knexInstance('test_obj').columnInfo();
        expect(columns).toHaveProperty('age');
        expect(columns).toHaveProperty('active');

        // 5. Verify data is intact
        const row = await knexInstance('test_obj').where('id', '1').first();
        expect(row.name).toBe('Old Data');
    });

    it('should not delete existing columns', async () => {
         // 1. Setup table with extra column
         await knexInstance.schema.createTable('test_obj', (t: any) => {
            t.string('id').primary();
            t.string('name');
            t.string('extra_column'); // Should stay
        });

        // 2. Init with only 'name'
        const objects = [{
            name: 'test_obj',
            fields: {
                name: { type: 'string' }
            }
        }];

        await driver.init(objects);

        const columns = await knexInstance('test_obj').columnInfo();
        expect(columns).toHaveProperty('name');
        expect(columns).toHaveProperty('extra_column'); // Preservation check
    });

    it('should not fail if table creation is repeated', async () => {
        const objects = [{
            name: 'test_obj',
            fields: {
                name: { type: 'string' }
            }
        }];

        // First init
        await driver.init(objects);
        
        // Second init (should be idempotent-ish, or just skip creation)
        await driver.init(objects);

        const exists = await knexInstance.schema.hasTable('test_obj');
        expect(exists).toBe(true);
    });

    it('should create json column for multiple=true fields', async () => {
        const objects = [{
            name: 'multi_test',
            fields: {
                tags: { type: 'select', multiple: true } as any,
                users: { type: 'lookup', reference_to: 'user', multiple: true } as any
            }
        }];

        await driver.init(objects);

        const columns = await knexInstance('multi_test').columnInfo();
        // Types in SQLite might be generic, but verifying we can insert/read array is best.
        
        // Try inserting array data
        await driver.create('multi_test', {
            tags: ['a', 'b'],
            users: ['u1', 'u2']
        });

        const results = await driver.find('multi_test', {});
        const row = results[0];

        // Driver should automatically parse JSON columns for SQLite
        expect(row.tags).toEqual(['a', 'b']);
        expect(row.users).toEqual(['u1', 'u2']);
    });

    it('should create percent column', async () => {
        const objects = [{
            name: 'percent_test',
            fields: {
                completion: { type: 'percent' } as any
            }
        }];

        await driver.init(objects);

        const columns = await knexInstance('percent_test').columnInfo();
        expect(columns).toHaveProperty('completion');
        
        // Insert a percentage
        await driver.create('percent_test', { completion: 0.85 });
        const res = await driver.find('percent_test', {});
        expect(res[0].completion).toBe(0.85);
    });

    it('should handle special fields (formula, summary, auto_number)', async () => {
        const objects = [{
            name: 'special_fields_test',
            fields: {
                // Formula should NOT create a column
                total: { type: 'formula', expression: 'price * qty', data_type: 'number' } as any,
                // Summary should create a numeric column
                child_count: { type: 'summary', summary_object: 'child_obj', summary_type: 'count' } as any,
                // Auto Number should create a string column
                invoice_no: { type: 'auto_number', auto_number_format: 'INV-{0000}' } as any
            }
        }];

        await driver.init(objects);

        const columns = await knexInstance('special_fields_test').columnInfo();
        
        expect(columns).not.toHaveProperty('total');
        expect(columns).toHaveProperty('child_count');
        expect(columns).toHaveProperty('invoice_no');
    });

    it('should create database constraints (unique, required)', async () => {
        const objects = [{
            name: 'constraint_test',
            fields: {
                unique_field: { type: 'string', unique: true } as any,
                required_field: { type: 'string', required: true } as any
            }
        }];

        await driver.init(objects);

        // Verify Unique using negative test?
        // SQLite enforces unique.
        await driver.create('constraint_test', { unique_field: 'u1', required_field: 'r1' });
        
        try {
            await driver.create('constraint_test', { unique_field: 'u1', required_field: 'r2' });
            fail('Should throw error for unique violation');
        } catch (e: any) {
            expect(e.message).toMatch(/UNIQUE constraint failed|duplicate key value/);
        }

        try {
            await driver.create('constraint_test', { unique_field: 'u2' });
            fail('Should throw error for not null violation');
        } catch (e: any) {
             expect(e.message).toMatch(/NOT NULL constraint failed|null value in column/);
        }
    });

    it('should handle new field types (email, file, location)', async () => {
        const objects = [{
            name: 'new_types_test',
            fields: {
                email: { type: 'email' } as any,
                profile_pic: { type: 'image' } as any,
                resume: { type: 'file' } as any,
                office_loc: { type: 'location' } as any,
                work_hours: { type: 'time' } as any
            }
        }];

        await driver.init(objects);
        const cols = await knexInstance('new_types_test').columnInfo();
        
        expect(cols).toHaveProperty('email');
        // File/Image/Location/Avatar are stored as JSON in KnexDriver mapping
        // But columnInfo might report 'text' for sqlite or 'json' for postgres.
        // We just ensure they were created.
        expect(cols).toHaveProperty('profile_pic');
        expect(cols).toHaveProperty('resume');
        
        // Test Insert for complex types
        await driver.create('new_types_test', {
            email: 'test@example.com',
            profile_pic: { url: 'http://img.com/1.png' },
            office_loc: { lat: 10, lng: 20 },
            work_hours: '09:00:00'
        });
        
        const res = await driver.find('new_types_test', {});
        const row = res[0];
        
        expect(row.email).toBe('test@example.com');
        expect(row.office_loc).toEqual({ lat: 10, lng: 20 }); // Auto-parsed by driver logic
    });
});
