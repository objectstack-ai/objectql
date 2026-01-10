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
        // Check if the metadata is customizable before allowing unregister
        if (type === 'object') {
            const existing = this.getEntry(type, id);
            if (existing && !this.isObjectCustomizable(existing.content)) {
                throw new Error(`Cannot delete system object '${id}'. This object is marked as non-customizable.`);
            }
        }
        this.store.get(type)?.delete(id);
    }
    
    unregisterPackage(packageName: string) {
        for (const [type, map] of this.store.entries()) {
            const entriesToDelete: string[] = [];
            
            for (const [id, meta] of map.entries()) {
                if (meta.package === packageName) {
                    // Check if the metadata is customizable before allowing unregister
                    if (type === 'object' && !this.isObjectCustomizable(meta.content)) {
                        throw new Error(`Cannot unregister package '${packageName}'. It contains non-customizable object '${id}'.`);
                    }
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

    /**
     * Helper to check if an object is customizable.
     * If customizable property is not specified, defaults to true.
     * @param obj The object configuration to check
     * @returns true if object is customizable (can be modified/deleted)
     */
    private isObjectCustomizable(obj: any): boolean {
        // Explicitly handle undefined: if not specified, default to true (customizable)
        return obj.customizable !== false;
    }

    /**
     * Helper to check if a field is customizable.
     * If customizable property is not specified, defaults to true.
     * @param field The field configuration to check
     * @returns true if field is customizable (can be modified/deleted)
     */
    private isFieldCustomizable(field: any): boolean {
        // Explicitly handle undefined: if not specified, default to true (customizable)
        return field.customizable !== false;
    }

    /**
     * Validates if an object can be modified based on its customizable flag.
     * Objects without the customizable property default to true (customizable).
     * @param objectName The name of the object to check
     * @returns true if the object can be modified, throws an error if not
     */
    validateObjectCustomizable(objectName: string): boolean {
        const entry = this.getEntry('object', objectName);
        if (!entry) {
            return true; // Object doesn't exist yet, allow creation
        }
        
        if (!this.isObjectCustomizable(entry.content)) {
            throw new Error(`Cannot modify system object '${objectName}'. This object is marked as non-customizable.`);
        }
        
        return true;
    }

    /**
     * Validates if a field can be modified based on its customizable flag.
     * Fields without the customizable property default to true (customizable).
     * @param objectName The name of the object containing the field
     * @param fieldName The name of the field to check
     * @returns true if the field can be modified, throws an error if not
     */
    validateFieldCustomizable(objectName: string, fieldName: string): boolean {
        const entry = this.getEntry('object', objectName);
        if (!entry || !entry.content.fields) {
            return true; // Object or field doesn't exist yet, allow creation
        }
        
        const field = entry.content.fields[fieldName];
        if (!field) {
            return true; // Field doesn't exist yet, allow creation
        }
        
        if (!this.isFieldCustomizable(field)) {
            throw new Error(`Cannot modify system field '${fieldName}' on object '${objectName}'. This field is marked as non-customizable.`);
        }
        
        return true;
    }
}
