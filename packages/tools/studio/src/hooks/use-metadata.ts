import { useState, useEffect } from 'react';

export interface Field {
    type: string;
    required?: boolean;
    label?: string;
}

export interface ObjectConfig {
    name: string;
    fields: Record<string, Field>;
    description?: string;
}

export function useMetadata() {
    const [objects, setObjects] = useState<ObjectConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        fetch('/api/metadata')
            .then(async res => {
                if (!res.ok) throw new Error('Failed to fetch metadata');
                // The API might return { objects: [...] } or just [...]
                // Assuming standard objectql server returns { objects: [...] } or Array
                const data = await res.json();
                // Check format
                const list = Array.isArray(data) ? data : (data.objects || []);
                setObjects(list);
            })
            .catch(err => {
                console.error(err);
                setError(err);
            })
            .finally(() => setLoading(false));
    }, []);

    return { objects, loading, error };
}
