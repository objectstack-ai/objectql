import { Driver } from '@objectql/types';

export class RemoteDriver implements Driver {
    constructor(private baseUrl: string) {}

    private async request(op: string, objectName: string, args: any) {
        // Implementation detail: we assume there is a standard endpoint '/api/objectql' 
        // that accepts the ObjectQLRequest format.
        const endpoint = `${this.baseUrl.replace(/\/$/, '')}/api/objectql`;
        
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                op,
                object: objectName,
                args
            })
        });
        
        const json = await res.json();
        
        if (json.error) {
            throw new Error(json.error.message);
        }
        
        return json.data;
    }

    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        return this.request('find', objectName, query);
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
        return this.request('findOne', objectName, { id, query }); // Note: args format must match server expectation
    }

    async create(objectName: string, data: any, options?: any): Promise<any> {
        return this.request('create', objectName, data);
    }

    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        // args for update: { id, data } based on server code: repo.update(req.args.id, req.args.data)
        return this.request('update', objectName, { id, data });
    }

    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        return this.request('delete', objectName, { id });
    }

    async count(objectName: string, filters: any, options?: any): Promise<number> {
        return this.request('count', objectName, filters);
    }
}
