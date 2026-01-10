
import { ObjectQL } from '../src';
import { ObjectConfig } from '@objectql/types';

describe('ObjectQL Remote Federation', () => {
    let originalFetch: any;

    beforeAll(() => {
        originalFetch = global.fetch;
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('should load remote objects and proxy queries', async () => {
        // 1. Mock Fetch
        const mockFetch = jest.fn();
        global.fetch = mockFetch;

        const remoteUrl = 'http://remote-service:3000';

        // Mock Responses
        mockFetch.mockImplementation(async (url: string, options: any) => {
            // A. Metadata List
            if (url === `${remoteUrl}/api/metadata/objects`) {
                return {
                    ok: true,
                    json: async () => ({
                        objects: [
                            { name: 'remote_user', label: 'Remote User' }
                        ]
                    })
                };
            }

            // B. Object Detail
            if (url === `${remoteUrl}/api/metadata/objects/remote_user`) {
                return {
                    ok: true,
                    json: async () => ({
                        name: 'remote_user',
                        fields: {
                            name: { type: 'text' },
                            email: { type: 'text' }
                        }
                    } as ObjectConfig)
                };
            }

            // C. Data Query (find)
            if (url === `${remoteUrl}/api/objectql`) {
                const body = JSON.parse(options.body);
                if (body.op === 'find' && body.object === 'remote_user') {
                    return {
                        ok: true,
                        json: async () => ({
                            data: [
                                { id: 1, name: 'Alice', email: 'alice@example.com' }
                            ]
                        })
                    };
                }
            }

            return { ok: false, status: 404 };
        });

        // 2. Init ObjectQL with remotes
        const app = new ObjectQL({
            remotes: [remoteUrl]
        });

        await app.init();

        // 3. Verify Schema is loaded
        const config = app.getObject('remote_user');
        expect(config).toBeDefined();
        expect(config?.datasource).toBe(`remote:${remoteUrl}`);

        // 4. Verify Query is proxied
        // Note: 'object()' is on Context, not App. We need to create a context first.
        const ctx = app.createContext({});
        const users = await ctx.object('remote_user').find();
        
        expect(users).toHaveLength(1);
        expect(users[0].name).toBe('Alice');

        // Verify fetch was called correctly
        expect(mockFetch).toHaveBeenCalledTimes(3); 
        // 1. api/metadata/objects -> List
        // 2. api/metadata/objects/remote_user -> Detail
        // 3. api/objectql -> Query
    });

    it('should handle remote errors gracefully', async () => {
        const mockFetch = jest.fn();
        global.fetch = mockFetch;
        const remoteUrl = 'http://broken-service:3000';

        // Mock Failure
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
        });

        const app = new ObjectQL({
            remotes: [remoteUrl]
        });

        // Should not throw, just log warning (which we can spy on if we want, but preventing crash is key)
        await expect(app.init()).resolves.not.toThrow();

        // Object shouldn't exist
        const config = app.getObject('remote_user');
        expect(config).toBeUndefined();
    });
});
