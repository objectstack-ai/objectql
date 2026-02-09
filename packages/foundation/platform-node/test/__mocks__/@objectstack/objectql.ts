/**
 * Mock for @objectstack/objectql
 * Provides minimal mock implementations for ObjectQL and SchemaRegistry
 */

export class ObjectQL {
    constructor() {}
}

export class SchemaRegistry {
    // Named 'metadata' to match what app.ts expects in unregisterPackage
    private static metadata = new Map<string, Map<string, any>>();
    
    constructor() {}
    
    static registerItem(type: string, item: any, idField: string = 'id'): void {
        if (!SchemaRegistry.metadata.has(type)) {
            SchemaRegistry.metadata.set(type, new Map());
        }
        const typeMap = SchemaRegistry.metadata.get(type)!;
        const id = item[idField];
        typeMap.set(id, item);
    }
    
    static getItem(type: string, id: string): any {
        const typeMap = SchemaRegistry.metadata.get(type);
        return typeMap ? typeMap.get(id) : undefined;
    }
    
    static listItems(type: string): any[] {
        const typeMap = SchemaRegistry.metadata.get(type);
        return typeMap ? Array.from(typeMap.values()) : [];
    }
    
    static unregisterPackage(packageName: string): void {
        for (const typeMap of SchemaRegistry.metadata.values()) {
            const toDelete: string[] = [];
            for (const [id, item] of typeMap.entries()) {
                if (item.package === packageName || item.packageName === packageName) {
                    toDelete.push(id);
                }
            }
            toDelete.forEach(id => typeMap.delete(id));
        }
    }
    
    static clear(): void {
        SchemaRegistry.metadata.clear();
    }
    
    register(_schema: any): void {}
    get(_name: string): any { return null; }
    list(): any[] { return []; }
}

export interface ObjectStackProtocolImplementation {
    name: string;
    handle(request: any): Promise<any>;
}
