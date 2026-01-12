import { Driver } from '@objectql/types';
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

    /**
     * Map API document (with 'id') to MongoDB document (with '_id')
     */
    private mapToMongo(doc: any): any {
        if (!doc) return doc;
        const { id, ...rest } = doc;
        if (id !== undefined) {
            return { _id: id, ...rest };
        }
        return doc;
    }

    /**
     * Map MongoDB document (with '_id') to API document (with 'id')
     */
    private mapFromMongo(doc: any): any {
        if (!doc) return doc;
        const { _id, ...rest } = doc;
        if (_id !== undefined) {
            return { id: _id, ...rest };
        }
        return doc;
    }

    /**
     * Map array of MongoDB documents to API documents
     */
    private mapFromMongoArray(docs: any[]): any[] {
        return docs.map(doc => this.mapFromMongo(doc));
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
                 
                 // Map both 'id' and '_id' to '_id' for MongoDB compatibility
                 // This ensures backward compatibility for queries using '_id'
                 const dbField = (field === 'id' || field === '_id') ? '_id' : field;
                 
                 if (dbField === '_id') {
                     mongoCondition[dbField] = this.normalizeId(value);
                 } else {
                     switch (op) {
                        case '=': mongoCondition[dbField] = { $eq: value }; break;
                        case '!=': mongoCondition[dbField] = { $ne: value }; break;
                        case '>': mongoCondition[dbField] = { $gt: value }; break;
                        case '>=': mongoCondition[dbField] = { $gte: value }; break;
                        case '<': mongoCondition[dbField] = { $lt: value }; break;
                        case '<=': mongoCondition[dbField] = { $lte: value }; break;
                        case 'in': mongoCondition[dbField] = { $in: value }; break;
                        case 'nin': mongoCondition[dbField] = { $nin: value }; break;
                        case 'contains': 
                             // Basic regex escape should be added for safety
                             mongoCondition[dbField] = { $regex: value, $options: 'i' }; 
                             break;
                        default: mongoCondition[dbField] = { $eq: value };
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
                // Map both 'id' and '_id' to '_id' for backward compatibility
                const dbField = (field === 'id' || field === '_id') ? '_id' : field;
                (findOptions.sort as any)[dbField] = order === 'desc' ? -1 : 1;
            }
        }
        if (query.fields && query.fields.length > 0) {
            findOptions.projection = {};
            for (const field of query.fields) {
                // Map both 'id' and '_id' to '_id' for backward compatibility
                const dbField = (field === 'id' || field === '_id') ? '_id' : field;
                (findOptions.projection as any)[dbField] = 1;
            }
        }

        const results = await collection.find(filter, findOptions).toArray();
        // Map MongoDB documents to API format (convert _id to id)
        return this.mapFromMongoArray(results);
    }

    async findOne(objectName: string, id: string | number, query?: any, options?: any) {
        const collection = await this.getCollection(objectName);
        if (id) {
            const result = await collection.findOne({ _id: this.normalizeId(id) });
            // Map MongoDB document to API format (convert _id to id)
            return this.mapFromMongo(result);
        }
        if (query) {
             const results = await this.find(objectName, { ...query, limit: 1 }, options);
             return results[0];
        }
        return null;
    }

    async create(objectName: string, data: any, options?: any) {
        const collection = await this.getCollection(objectName);
        
        // Map API document (id) to MongoDB document (_id)
        const mongoDoc = this.mapToMongo(data);
        
        // If no _id is provided, generate a String ID instead of allowing Mongo to generate an ObjectId
        if (!mongoDoc._id) {
            mongoDoc._id = new ObjectId().toHexString();
        }

        const result = await collection.insertOne(mongoDoc);
        // Return API format document (convert _id to id)
        return this.mapFromMongo({ ...mongoDoc, _id: result.insertedId });
    }

    async update(objectName: string, id: string | number, data: any, options?: any) {
        const collection = await this.getCollection(objectName);
        
        // Map API document (id) to MongoDB document (_id) for update data
        // But we should not allow updating the _id field itself
        const { id: _ignoredId, ...updateData } = data; // intentionally ignore id to prevent updating primary key
        
        // Handle atomic operators if present
        const isAtomic = Object.keys(updateData).some(k => k.startsWith('$'));
        const update = isAtomic ? updateData : { $set: updateData };

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
        if (!data || data.length === 0) return [];
        const collection = await this.getCollection(objectName);
        // Map all API documents to MongoDB format
        const mongoDocs = data.map(doc => {
            const mongoDoc = this.mapToMongo(doc);
            if (!mongoDoc._id) {
                mongoDoc._id = new ObjectId().toHexString();
            }
            return mongoDoc;
        });
        const result = await collection.insertMany(mongoDocs);
        // Return API format (convert _id to id)
        return Object.values(result.insertedIds).map(id => ({ id }));
    }

    async updateMany(objectName: string, filters: any, data: any, options?: any): Promise<any> {
        const collection = await this.getCollection(objectName);
        const filter = this.mapFilters(filters);
        
        // Remove 'id' field from update data as it shouldn't be updated
        const { id: idToIgnore, ...updateData } = data;
        
        const isAtomic = Object.keys(updateData).some(k => k.startsWith('$'));
        const update = isAtomic ? updateData : { $set: updateData };
        
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
        const results = await collection.aggregate(pipeline).toArray();
        // Map MongoDB documents to API format (convert _id to id)
        return this.mapFromMongoArray(results);
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
        }
    }
}

