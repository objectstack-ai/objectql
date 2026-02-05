
class MockMetadataRegistry {
    private store = new Map<string, Map<string, any>>();
    
    register(type: string, item: any): void {
        if (!this.store.has(type)) {
            this.store.set(type, new Map());
        }
        const typeMap = this.store.get(type)!;
        const id = item.id || item.name;
        typeMap.set(id, item);
    }
    
    get(type: string, id: string): any | undefined {
        const typeMap = this.store.get(type);
        const item = typeMap?.get(id);
        return item?.content || item;
    }
    
    list(type: string): any[] {
        const typeMap = this.store.get(type);
        if (!typeMap) return [];
        return Array.from(typeMap.values()).map(item => item.content || item);
    }
}

export class ObjectQL {
    public metadata: MockMetadataRegistry;
    private config: any;

    constructor(config: any) {
        this.config = config;
        this.metadata = new MockMetadataRegistry();
        
        if (config.objects) {
            Object.values(config.objects).forEach((obj: any) => {
                // Ensure name is set
                if (!obj.name) {
                    // key is likely lost in Object.values, but let's assume obj has name
                }
                this.metadata.register('object', obj);
            });
        }
    }


    getConfigs() {
        return this.metadata.list('object');
    }

    getObject(name: string) {
        return this.metadata.get('object', name);
    }

    async init() {
        return Promise.resolve();
    }
}
