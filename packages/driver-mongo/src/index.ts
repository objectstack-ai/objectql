import { Driver } from '@objectql/core';
import { MongoClient, Db, Filter, ObjectId, FindOptions } from 'mongodb';

export class MongoDriver implements Driver {
    private client: MongoClient;
    private db?: Db;
    private config: any;
    private connected: Promise<void>;

    constructor(config: { url: string, dbName?: string }) {
        this.config = config;
        this.client = new MongoClient(config.url);
        this.connected = this.connect();
    }

    private async connect() {
        await this.client.connect();
        this.db = this.client.db(this.config.dbName);
    }

    private async getCollection(objectName: string) {
        await this.connected;
        if (!this.db) throw new Error("Database not initialized");
        return this.db.collection<any>(objectName);
    }

    private normalizeId(id: string | number | ObjectId): ObjectId | string | number {
        // User requested String IDs, so we do NOT convert 24-char strings to ObjectId.
        // We only pass through what is given.
        return id;
    }

    private mapFilters(filters: any): Filter<any> {
        if (!filters || filters.length === 0) return {};
        
        // Simple case: Array of arrays [['a','=','1'], ['b','=','2']] (Implicit AND)
        // or Mixed: [['a','=','1'], 'and', ['b','=','2']]
        
        const conditions: any[] = [];
        let currentLogic = '$and'; // Default implicit logic

        for (const item of filters) {
             if (Array.isArray(item)) {
                 const [field, op, value] = item;
                 let mongoCondition: any = {};
                 
                 if (field === '_id') {
                     mongoCondition[field] = this.normalizeId(value);
                 } else {
                     switch (op) {
                        case '=': mongoCondition[field] = { $eq: value }; break;
                        case '!=': mongoCondition[field] = { $ne: value }; break;
                        case '>': mongoCondition[field] = { $gt: value }; break;
                        case '>=': mongoCondition[field] = { $gte: value }; break;
                        case '<': mongoCondition[field] = { $lt: value }; break;
                        case '<=': mongoCondition[field] = { $lte: value }; break;
                        case 'in': mongoCondition[field] = { $in: value }; break;
                        case 'nin': mongoCondition[field] = { $nin: value }; break;
                        case 'contains': 
                             // Basic regex escape should be added for safety
                             mongoCondition[field] = { $regex: value, $options: 'i' }; 
                             break;
                        default: mongoCondition[field] = { $eq: value };
                     }
                 }
                 conditions.push(mongoCondition);

             } else if (typeof item === 'string') {
                 if (item.toLowerCase() === 'or') {
                     // If we encounter an OR, we might need to restructure.
                     // For simplicity in this v1, let's assume simple ANDs usually, 
                     // OR handling requires more complex tree parsing if mixed.
                     // But if it's strictly [A, 'or', B], we can do strict mapping.
                     // This is a simplified parser:
                     currentLogic = '$or';
                 } else if (item.toLowerCase() === 'and') {
                     currentLogic = '$and';
                 }
             }
        }

        if (conditions.length === 0) return {};
        if (conditions.length === 1) return conditions[0];
        
        // If 'or' was detected, wrap all in $or (very naive implementation)
        if (currentLogic === '$or') {
            return { $or: conditions };
        }
        
        return { $and: conditions };
    }

    async find(objectName: string, query: any, options?: any): Promise<any[]> {
        const collection = await this.getCollection(objectName);
        const filter = this.mapFilters(query.filters);
        
        const findOptions: FindOptions = {};
        if (query.skip) findOptions.skip = query.skip;
        if (query.limit) findOptions.limit = query.limit;
        if (query.sort) {
            // map [['field', 'desc']] to { field: -1 }
            findOptions.sort = {};
            for (const [field, order] of query.sort) {
                (findOptions.sort as any)[field] = order === 'desc' ? -1 : 1;
            }
        }
        if (query.fields && query.fields.length > 0) {
            findOptions.projection = {};
            for (const field of query.fields) {
                (findOptions.projection as any)[field] = 1;
            }
        }

        const results = await collection.find(filter, findOptions).toArray();
        return results;
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any) {
        const collection = await this.getCollection(objectName);
        if (id) {
            return await collection.findOne({ _id: this.normalizeId(id) });
        }
        if (query) {
             const results = await this.find(objectName, { ...query, limit: 1 }, options);
             return results[0];
        }
        return null;
    }

    async create(objectName: string, data: any, options?: any) {
        const collection = await this.getCollection(objectName);
        
        // If no ID is provided, generate a String ID instead of allowing Mongo to generate an ObjectId
        if (!data._id) {
            data._id = new ObjectId().toHexString();
        }

        const result = await collection.insertOne(data);
        return { ...data, _id: result.insertedId };
    }

    async update(objectName: string, id: string | number, data: any, options?: any) {
        const collection = await this.getCollection(objectName);
        
        // Handle atomic operators if present
        const isAtomic = Object.keys(data).some(k => k.startsWith('$'));
        const update = isAtomic ? data : { $set: data };

        const result = await collection.updateOne({ _id: this.normalizeId(id) }, update);
        return result.modifiedCount; // or return updated document?
    }

    async delete(objectName: string, id: string | number, options?: any) {
        const collection = await this.getCollection(objectName);
        const result = await collection.deleteOne({ _id: this.normalizeId(id) });
        return result.deletedCount;
    }

    async count(objectName: string, filters: any, options?: any): Promise<number> {
        const collection = await this.getCollection(objectName);
        const filter = this.mapFilters(filters);
        return await collection.countDocuments(filter);
    }
    
    // Bulk Operations
    async createMany(objectName: string, data: any[], options?: any): Promise<any> {
        const collection = await this.getCollection(objectName);
        const result = await collection.insertMany(data);
        return result.insertedIds;
    }

    async updateMany(objectName: string, filters: any, data: any, options?: any): Promise<any> {
        const collection = await this.getCollection(objectName);
        const filter = this.mapFilters(filters);
        const isAtomic = Object.keys(data).some(k => k.startsWith('$'));
        const update = isAtomic ? data : { $set: data };
        
        const result = await collection.updateMany(filter, update);
        return result.modifiedCount;
    }

    async deleteMany(objectName: string, filters: any, options?: any): Promise<any> {
        const collection = await this.getCollection(objectName);
        const filter = this.mapFilters(filters);
        const result = await collection.deleteMany(filter);
        return result.deletedCount;
    }

    async aggregate(objectName: string, pipeline: any[], options?: any): Promise<any[]> {
        const collection = await this.getCollection(objectName);
        return await collection.aggregate(pipeline).toArray();
    }
}

