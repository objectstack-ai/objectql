export interface Metadata {
    type: string;
    id: string;
    path?: string;
    package?: string;
    content: any;
}

export class MetadataRegistry {
    // Map<type, Map<id, Metadata>>
    private store: Map<string, Map<string, Metadata>> = new Map();

    register(type: string, metadata: Metadata) {
        if (!this.store.has(type)) {
            this.store.set(type, new Map());
        }
        this.store.get(type)!.set(metadata.id, metadata);
    }

    unregister(type: string, id: string) {
        this.store.get(type)?.delete(id);
    }
    
    unregisterPackage(packageName: string) {
        for (const [type, map] of this.store.entries()) {
            const entriesToDelete: string[] = [];
            
            for (const [id, meta] of map.entries()) {
                if (meta.package === packageName) {
                    entriesToDelete.push(id);
                }
            }
            
            // Delete all collected entries
            for (const id of entriesToDelete) {
                map.delete(id);
            }
        }
    }

    get<T = any>(type: string, id: string): T | undefined {
        return this.store.get(type)?.get(id)?.content as T;
    }

    list<T = any>(type: string): T[] {
        const map = this.store.get(type);
        if (!map) return [];
        return Array.from(map.values()).map(m => m.content as T);
    }
    
    getEntry(type: string, id: string): Metadata | undefined {
        return this.store.get(type)?.get(id);
    }
}
