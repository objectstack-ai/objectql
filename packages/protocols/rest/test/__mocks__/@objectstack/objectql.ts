/**
 * Mock for @objectstack/objectql 1.1.0
 * Provides minimal mock implementations for ObjectQL and SchemaRegistry
 * Updated to match the new namespace/FQN/ownership API surface.
 */

export class ObjectQL {
    constructor() {}
}

export const RESERVED_NAMESPACES = new Set(['base', 'system']);
export const DEFAULT_OWNER_PRIORITY = 100;
export const DEFAULT_EXTENDER_PRIORITY = 200;

export function computeFQN(namespace: string | undefined, shortName: string): string {
    if (!namespace || RESERVED_NAMESPACES.has(namespace)) return shortName;
    return `${namespace}__${shortName}`;
}

export function parseFQN(fqn: string): { namespace: string | undefined; shortName: string } {
    const idx = fqn.indexOf('__');
    if (idx < 0) return { namespace: undefined, shortName: fqn };
    return { namespace: fqn.slice(0, idx), shortName: fqn.slice(idx + 2) };
}

export interface ObjectContributor {
    packageId: string;
    namespace: string;
    ownership: 'own' | 'extend';
    priority: number;
    definition: any;
}

export class SchemaRegistry {
    private static metadata = new Map<string, Map<string, any>>();
    private static objectContributors = new Map<string, ObjectContributor[]>();
    private static namespaceRegistry = new Map<string, string>();
    private static _logLevel: string = 'warn';
    
    constructor() {}

    static get logLevel(): string { return SchemaRegistry._logLevel; }
    static set logLevel(level: string) { SchemaRegistry._logLevel = level; }
    
    // Namespace management
    static registerNamespace(namespace: string, packageId: string): void {
        SchemaRegistry.namespaceRegistry.set(namespace, packageId);
    }
    static unregisterNamespace(namespace: string, _packageId: string): void {
        SchemaRegistry.namespaceRegistry.delete(namespace);
    }
    static getNamespaceOwner(namespace: string): string | undefined {
        return SchemaRegistry.namespaceRegistry.get(namespace);
    }

    // Object registration with ownership
    static registerObject(
        schema: any, packageId: string, namespace?: string,
        ownership: 'own' | 'extend' = 'own', priority: number = DEFAULT_OWNER_PRIORITY
    ): string {
        const fqn = computeFQN(namespace, schema.name);
        const contributor: ObjectContributor = { packageId, namespace: namespace || '', ownership, priority, definition: schema };
        const existing = SchemaRegistry.objectContributors.get(fqn) || [];
        existing.push(contributor);
        SchemaRegistry.objectContributors.set(fqn, existing);
        return fqn;
    }
    static resolveObject(fqn: string): any | undefined {
        const contributors = SchemaRegistry.objectContributors.get(fqn);
        if (!contributors || contributors.length === 0) return undefined;
        return contributors.sort((a, b) => a.priority - b.priority)[0]?.definition;
    }
    static getObject(name: string): any | undefined {
        return SchemaRegistry.resolveObject(name);
    }
    static getAllObjects(packageId?: string): any[] {
        const results: any[] = [];
        for (const [, contributors] of SchemaRegistry.objectContributors) {
            const filtered = packageId ? contributors.filter(c => c.packageId === packageId) : contributors;
            if (filtered.length > 0) results.push(filtered[0].definition);
        }
        return results;
    }
    static getObjectContributors(fqn: string): ObjectContributor[] {
        return SchemaRegistry.objectContributors.get(fqn) || [];
    }
    static getObjectOwner(fqn: string): ObjectContributor | undefined {
        const contributors = SchemaRegistry.objectContributors.get(fqn) || [];
        return contributors.find(c => c.ownership === 'own');
    }
    static unregisterObjectsByPackage(packageId: string, _force?: boolean): void {
        for (const [fqn, contributors] of SchemaRegistry.objectContributors) {
            const remaining = contributors.filter(c => c.packageId !== packageId);
            if (remaining.length === 0) SchemaRegistry.objectContributors.delete(fqn);
            else SchemaRegistry.objectContributors.set(fqn, remaining);
        }
    }

    // Universal metadata methods
    static registerItem<T>(type: string, item: any, idField: string = 'id', packageId?: string): void {
        if (!SchemaRegistry.metadata.has(type)) {
            SchemaRegistry.metadata.set(type, new Map());
        }
        const typeMap = SchemaRegistry.metadata.get(type)!;
        const id = item[idField];
        if (packageId) item._packageId = packageId;
        typeMap.set(id, item);
    }
    
    static getItem<T>(type: string, id: string): any {
        const typeMap = SchemaRegistry.metadata.get(type);
        const item = typeMap ? typeMap.get(id) : undefined;
        if (item && item.content) return item.content;
        return item;
    }
    
    static listItems<T>(type: string, packageId?: string): any[] {
        const typeMap = SchemaRegistry.metadata.get(type);
        if (!typeMap) return [];
        let items = Array.from(typeMap.values());
        if (packageId) items = items.filter((i: any) => i._packageId === packageId);
        return items.map((item: any) => {
            if (item && item.content) return item.content;
            return item;
        });
    }

    static unregisterItem(type: string, name: string): void {
        const typeMap = SchemaRegistry.metadata.get(type);
        if (typeMap) typeMap.delete(name);
    }

    static getRegisteredTypes(): string[] {
        return Array.from(SchemaRegistry.metadata.keys());
    }

    static validate(_type: string, _item: any): true | { fields: Record<string, any> } {
        return true;
    }
    
    // Legacy compatibility
    static unregisterPackage(packageName: string): void {
        SchemaRegistry.unregisterObjectsByPackage(packageName);
        for (const typeMap of SchemaRegistry.metadata.values()) {
            const toDelete: string[] = [];
            for (const [id, item] of typeMap.entries()) {
                if (item.package === packageName || item.packageName === packageName || item._packageId === packageName) {
                    toDelete.push(id);
                }
            }
            toDelete.forEach(id => typeMap.delete(id));
        }
    }
    
    static reset(): void {
        SchemaRegistry.metadata.clear();
        SchemaRegistry.objectContributors.clear();
        SchemaRegistry.namespaceRegistry.clear();
    }
    static clear(): void { SchemaRegistry.reset(); }
    
    register(schema: any): void {}
    get(name: string): any { return null; }
    list(): any[] { return []; }
}

export class ObjectQLPlugin {
    name = 'objectql';
    constructor() {}
}

export interface ObjectStackProtocolImplementation {
    name: string;
    handle(request: any): Promise<any>;
}
