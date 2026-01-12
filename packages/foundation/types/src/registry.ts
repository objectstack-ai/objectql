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
        const map = this.store.get(type);
        if (map) {
            map.delete(id);
        }
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
        const map = this.store.get(type);
        if (!map) return undefined;
        const entry = map.get(id);
        return entry ? entry.content as T : undefined;
    }

    list<T = any>(type: string): T[] {
        const map = this.store.get(type);
        if (!map) return [];
        return Array.from(map.values()).map(m => m.content as T);
    }
    
    getEntry(type: string, id: string): Metadata | undefined {
        const map = this.store.get(type);
        return map ? map.get(id) : undefined;
    }
}
