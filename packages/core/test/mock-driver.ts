import { Driver } from '../src/driver';

export class MockDriver implements Driver {
    private data: Record<string, any[]> = {};
    private transactions: Set<any> = new Set();
    
    constructor() {}

    private getData(objectName: string) {
        if (!this.data[objectName]) {
            this.data[objectName] = [];
        }
        return this.data[objectName];
    }

    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        const items = this.getData(objectName);
        // Very basic filter implementation for testing
        if (query.filters) {
            return items.filter(item => {
                // Assuming simple filter: [['field', '=', 'value']]
                const filter = query.filters[0]; 
                if (filter && Array.isArray(filter) && filter[1] === '=') {
                    return item[filter[0]] === filter[2];
                }
                return true;
            });
        }
        return items;
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any> {
        const items = this.getData(objectName);
        return items.find((item: any) => item._id === id);
    }

    async create(objectName: string, data: any, options?: any): Promise<any> {
        const items = this.getData(objectName);
        const newItem = {
            ...data,
            _id: data._id || `id-${Date.now()}-${Math.random()}`
        };
        items.push(newItem);
        return newItem;
    }

    async update(objectName: string, id: string | number, data: any, options?: any): Promise<any> {
        const items = this.getData(objectName);
        const index = items.findIndex((item: any) => item._id === id);
        if (index > -1) {
            items[index] = { ...items[index], ...data };
            return items[index];
        }
        throw new Error('Not found');
    }

    async delete(objectName: string, id: string | number, options?: any): Promise<any> {
        const items = this.getData(objectName);
        const index = items.findIndex((item: any) => item._id === id);
        if (index > -1) {
            items.splice(index, 1);
            return true;
        }
        return false;
    }

    async count(objectName: string, filters: any, options?: any): Promise<number> {
        return (await this.find(objectName, { filters }, options)).length;
    }

    async beginTransaction(): Promise<any> {
        const trx = { id: Date.now() };
        this.transactions.add(trx);
        return trx;
    }

    async commitTransaction(trx: any): Promise<void> {
        if (!this.transactions.has(trx)) throw new Error('Invalid transaction');
        this.transactions.delete(trx);
    }

    async rollbackTransaction(trx: any): Promise<void> {
        if (!this.transactions.has(trx)) throw new Error('Invalid transaction');
        this.transactions.delete(trx);
    }
}
