export interface Driver {
    find(objectName: string, query: any, options?: any): Promise<any[]>;
    findOne(objectName: string, id: string | number, query?: any, options?: any): Promise<any>;
    create(objectName: string, data: any, options?: any): Promise<any>;
    update(objectName: string, id: string | number, data: any, options?: any): Promise<any>;
    delete(objectName: string, id: string | number, options?: any): Promise<any>;
    count(objectName: string, filters: any, options?: any): Promise<number>;
    
    // Schema / Lifecycle
    init?(objects: any[]): Promise<void>;

    // Advanced
    aggregate?(objectName: string, query: any, options?: any): Promise<any>;
    distinct?(objectName: string, field: string, filters?: any, options?: any): Promise<any[]>;
    
    // Bulk / Atomic
    createMany?(objectName: string, data: any[], options?: any): Promise<any>;
    updateMany?(objectName: string, filters: any, data: any, options?: any): Promise<any>;
    deleteMany?(objectName: string, filters: any, options?: any): Promise<any>;
    findOneAndUpdate?(objectName: string, filters: any, update: any, options?: any): Promise<any>;

    // Transaction
    beginTransaction?(): Promise<any>;
    commitTransaction?(trx: any): Promise<void>;
    rollbackTransaction?(trx: any): Promise<void>;
}

