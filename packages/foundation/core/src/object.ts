import { ObjectConfig, MetadataRegistry } from '@objectql/types';

export function registerObjectHelper(metadata: MetadataRegistry, object: ObjectConfig) {
    // Normalize fields
    if (object.fields) {
        for (const [key, field] of Object.entries(object.fields)) {
            if (!field.name) {
                field.name = key;
            }
        }
    }
    metadata.register('object', {
        type: 'object',
        id: object.name,
        content: object
    });
}

export function getConfigsHelper(metadata: MetadataRegistry): Record<string, ObjectConfig> {
    const result: Record<string, ObjectConfig> = {};
    const objects = metadata.list<ObjectConfig>('object');
    for (const obj of objects) {
        result[obj.name] = obj;
    }
    return result;
}
