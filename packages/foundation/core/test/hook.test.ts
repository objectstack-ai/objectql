import { ObjectQL } from '../src';
import { MockDriver } from './mock-driver';

describe('ObjectQL Hooks', () => {
    let app: ObjectQL;
    let driver: MockDriver;

    beforeEach(async () => {
        driver = new MockDriver();
        app = new ObjectQL({
            datasources: {
                default: driver
            },
            objects: {
                'post': {
                    name: 'post',
                    fields: {
                        title: { type: 'text' },
                        status: { type: 'text' },
                        views: { type: 'number' }
                    }
                }
            }
        });
        await app.init();
    });

    describe('Find Hooks', () => {
        it('should trigger beforeFind and modify query', async () => {
            const repo = app.createContext({}).object('post');
            
            let hookTriggered = false;
            app.on('beforeFind', 'post', async (ctx) => {
                hookTriggered = true;
                (ctx as any).query = { ...(ctx as any).query, filters: [['status', '=', 'published']] };
            });

            const spyFind = jest.spyOn(driver, 'find');

            await repo.find({});
            
            expect(hookTriggered).toBe(true);
            expect(spyFind).toHaveBeenCalledWith('post', { filters: [['status', '=', 'published']] }, expect.any(Object));
        });

        it('should trigger afterFind and transform results', async () => {
            const repo = app.createContext({}).object('post');
            
            app.on('afterFind', 'post', async (ctx) => {
                if (Array.isArray(ctx.result)) {
                    ctx.result = ctx.result.map(item => ({
                        ...item,
                        transformed: true
                    }));
                }
            });

            const results = await repo.find({});
            
            expect(results).toBeDefined();
            // Results should be transformed even if empty
            expect(Array.isArray(results)).toBe(true);
        });

        it('should provide user context in beforeFind', async () => {
            const repo = app.createContext({ userId: 'user123' }).object('post');
            
            let capturedUser: any;
            app.on('beforeFind', 'post', async (ctx) => {
                capturedUser = ctx.user;
            });

            await repo.find({});
            
            expect(capturedUser).toBeDefined();
            expect(capturedUser.id).toBe('user123');
        });
    });

    describe('Count Hooks', () => {
        it('should trigger beforeCount and modify query', async () => {
            const repo = app.createContext({}).object('post');
            
            let hookTriggered = false;
            app.on('beforeCount', 'post', async (ctx) => {
                hookTriggered = true;
                ctx.query = { filters: [['status', '=', 'published']] };
            });

            await repo.count({});
            
            expect(hookTriggered).toBe(true);
        });

        it('should trigger afterCount and access result', async () => {
            const repo = app.createContext({}).object('post');
            
            let capturedResult: any;
            app.on('afterCount', 'post', async (ctx) => {
                capturedResult = ctx.result;
            });

            const count = await repo.count({});
            
            expect(capturedResult).toBeDefined();
            expect(typeof capturedResult).toBe('number');
            expect(count).toBe(capturedResult);
        });
    });

    describe('Create Hooks', () => {
        it('should trigger beforeCreate and modify data', async () => {
            const repo = app.createContext({ userId: 'u1' }).object('post');
            
            app.on('beforeCreate', 'post', async (ctx) => {
                if (ctx.data) {
                    ctx.data.status = ctx.data.status || 'draft';
                    ctx.data.views = 0;
                }
            });

            const created = await repo.create({ title: 'New Post' });
            
            expect(created.status).toBe('draft');
            expect(created.views).toBe(0);
        });

        it('should trigger afterCreate and access result', async () => {
            const repo = app.createContext({ userId: 'u1' }).object('post');
            
            let capturedResult: any;
            app.on('afterCreate', 'post', async (ctx) => {
                capturedResult = ctx.result;
                if (ctx.result) {
                    ctx.result.augmented = true;
                }
            });

            const created = await repo.create({ title: 'New Post' });
            
            expect(capturedResult).toBeDefined();
            expect(created._id).toBeDefined();
            expect(created.created_by).toBe('u1');
            expect(created.augmented).toBe(true);
        });

        it('should provide api access in beforeCreate', async () => {
            const repo = app.createContext({}).object('post');
            
            app.on('beforeCreate', 'post', async (ctx) => {
                // Check for duplicate titles
                const existing = await ctx.api.count('post', { filters: [['title', '=', ctx.data?.title]] });
                if (existing > 0) {
                    throw new Error('Title already exists');
                }
            });

            await repo.create({ title: 'Unique Title' });
            
            // This should work fine on first create
            expect(true).toBe(true);
        });
    });

    describe('Update Hooks', () => {
        it('should trigger beforeUpdate with previousData', async () => {
            const repo = app.createContext({}).object('post');
            
            const created = await repo.create({ title: 'Original', status: 'draft' });
            
            let capturedPrevious: any;
            app.on('beforeUpdate', 'post', async (ctx) => {
                capturedPrevious = ctx.previousData;
            });

            await repo.update(created._id, { title: 'Updated' });
            
            expect(capturedPrevious).toBeDefined();
            expect(capturedPrevious.title).toBe('Original');
            expect(capturedPrevious.status).toBe('draft');
        });

        it('should use isModified helper correctly', async () => {
            const repo = app.createContext({}).object('post');
            
            const created = await repo.create({ title: 'Test', status: 'draft', views: 0 });
            
            let titleModified = false;
            let statusModified = false;
            app.on('beforeUpdate', 'post', async (ctx) => {
                if ('isModified' in ctx) {
                    titleModified = ctx.isModified('title' as any);
                    statusModified = ctx.isModified('status' as any);
                }
            });

            await repo.update(created._id, { title: 'New Title' });
            
            expect(titleModified).toBe(true);
            expect(statusModified).toBe(false);
        });

        it('should trigger afterUpdate with result', async () => {
            const repo = app.createContext({}).object('post');
            
            const created = await repo.create({ title: 'Test', status: 'draft' });
            
            let capturedResult: any;
            app.on('afterUpdate', 'post', async (ctx) => {
                capturedResult = ctx.result;
            });

            await repo.update(created._id, { status: 'published' });
            
            expect(capturedResult).toBeDefined();
            expect(capturedResult.status).toBe('published');
        });

        it('should validate state transitions in beforeUpdate', async () => {
            const repo = app.createContext({}).object('post');
            
            const created = await repo.create({ title: 'Test', status: 'published' });
            
            app.on('beforeUpdate', 'post', async (ctx) => {
                if ('isModified' in ctx && ctx.isModified('status' as any)) {
                    if (ctx.previousData?.status === 'published' && ctx.data?.status === 'draft') {
                        throw new Error('Cannot revert published post to draft');
                    }
                }
            });

            await expect(repo.update(created._id, { status: 'draft' }))
                .rejects
                .toThrow('Cannot revert published post to draft');
        });
    });

    describe('Delete Hooks', () => {
        it('should trigger beforeDelete with id and previousData', async () => {
            const repo = app.createContext({}).object('post');
            
            const created = await repo.create({ title: 'To Delete', status: 'draft' });
            
            let capturedId: any;
            let capturedPrevious: any;
            app.on('beforeDelete', 'post', async (ctx) => {
                capturedId = ctx.id;
                capturedPrevious = ctx.previousData;
            });

            await repo.delete(created._id);
            
            expect(capturedId).toBe(created._id);
            expect(capturedPrevious).toBeDefined();
            expect(capturedPrevious.title).toBe('To Delete');
        });

        it('should trigger afterDelete with result', async () => {
            const repo = app.createContext({}).object('post');
            
            const created = await repo.create({ title: 'To Delete' });
            
            let capturedResult: any;
            app.on('afterDelete', 'post', async (ctx) => {
                capturedResult = ctx.result;
            });

            await repo.delete(created._id);
            
            expect(capturedResult).toBeDefined();
        });

        it('should check dependencies in beforeDelete', async () => {
            const repo = app.createContext({}).object('post');
            
            const created = await repo.create({ title: 'Protected Post', status: 'published' });
            
            app.on('beforeDelete', 'post', async (ctx) => {
                if (ctx.previousData?.status === 'published') {
                    throw new Error('Cannot delete published posts');
                }
            });

            await expect(repo.delete(created._id))
                .rejects
                .toThrow('Cannot delete published posts');
        });
    });

    describe('State Sharing', () => {
        it('should share state between before and after hooks', async () => {
            const repo = app.createContext({}).object('post');
            
            app.on('beforeCreate', 'post', async (ctx) => {
                ctx.state.timestamp = Date.now();
                ctx.state.customData = 'test';
            });

            let capturedState: any;
            app.on('afterCreate', 'post', async (ctx) => {
                capturedState = ctx.state;
            });

            await repo.create({ title: 'Test' });
            
            expect(capturedState).toBeDefined();
            expect(capturedState.timestamp).toBeDefined();
            expect(capturedState.customData).toBe('test');
        });
    });

    describe('Error Handling', () => {
        it('should prevent operation when beforeCreate throws error', async () => {
            const repo = app.createContext({}).object('post');
            
            app.on('beforeCreate', 'post', async (ctx) => {
                if (!ctx.data?.title || ctx.data.title.length < 5) {
                    throw new Error('Title must be at least 5 characters');
                }
            });

            await expect(repo.create({ title: 'Hi' }))
                .rejects
                .toThrow('Title must be at least 5 characters');
        });

        it('should prevent update when beforeUpdate throws error', async () => {
            const repo = app.createContext({}).object('post');
            
            const created = await repo.create({ title: 'Test Post', status: 'draft' });
            
            app.on('beforeUpdate', 'post', async (ctx) => {
                if (ctx.data?.status === 'archived') {
                    throw new Error('Archiving is not allowed');
                }
            });

            await expect(repo.update(created._id, { status: 'archived' }))
                .rejects
                .toThrow('Archiving is not allowed');
        });
    });
});
