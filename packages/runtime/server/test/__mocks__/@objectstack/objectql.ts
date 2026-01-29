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
        const item = typeMap ? typeMap.get(id) : undefined;
        // Unwrap content if present, matching MetadataRegistry behavior
        if (item && item.content) {
            return item.content;
        }
        return item;
    }
    
    static listItems(type: string): any[] {
        const typeMap = SchemaRegistry.metadata.get(type);
        if (!typeMap) return [];
        // Unwrap content from each item, matching MetadataRegistry behavior
        return Array.from(typeMap.values()).map((item: any) => {
            if (item && item.content) {
                return item.content;
            }
            return item;
        });
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
    
    register(schema: any): void {}
    get(name: string): any { return null; }
    list(): any[] { return []; }
}

export interface ObjectStackProtocolImplementation {
    name: string;
    handle(request: any): Promise<any>;
}
