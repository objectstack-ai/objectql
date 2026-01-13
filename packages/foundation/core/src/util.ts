export function toTitleCase(str: string): string {
    return str
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Apply namespace prefix to object name
 * @param objectName - The original object name
 * @param namespace - The namespace to apply
 * @returns Namespaced object name (e.g., 'audit__note')
 */
export function applyNamespace(objectName: string, namespace: string): string {
    if (!namespace) return objectName;
    // Avoid double-prefixing
    if (objectName.startsWith(`${namespace}__`)) return objectName;
    return `${namespace}__${objectName}`;
}

/**
 * Remove namespace prefix from object name
 * @param namespacedName - The namespaced object name
 * @param namespace - The namespace to remove
 * @returns Original object name without namespace
 */
export function removeNamespace(namespacedName: string, namespace: string): string {
    if (!namespace) return namespacedName;
    const prefix = `${namespace}__`;
    if (namespacedName.startsWith(prefix)) {
        return namespacedName.substring(prefix.length);
    }
    return namespacedName;
}

/**
 * Extract namespace from a namespaced object name
 * @param namespacedName - The namespaced object name (e.g., 'audit__note')
 * @returns The namespace part or undefined
 */
export function extractNamespace(namespacedName: string): string | undefined {
    const match = namespacedName.match(/^(.+?)__/);
    return match ? match[1] : undefined;
}

/**
 * Check if an object name has a namespace
 * @param objectName - The object name to check
 * @returns true if the name contains a namespace prefix
 */
export function hasNamespace(objectName: string): boolean {
    return /__/.test(objectName);
}
