/**
 * Unique ID generation utilities for React keys and element identification
 *
 * These utilities help generate stable, unique identifiers for React components,
 * particularly for list items that need proper key props.
 */

/**
 * Generate a unique ID with optional prefix
 *
 * @param prefix - Prefix for the ID (default: 'item')
 * @returns Unique ID string
 *
 * @example
 * const id = generateUniqueId('product'); // 'product-1234567890-abc123def'
 */
export function generateUniqueId(prefix: string = 'item'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get a stable key for array items, preferring existing IDs
 *
 * @param item - Item that may have an id property
 * @param index - Array index as fallback
 * @param prefix - Prefix for generated keys
 * @returns Stable key string
 *
 * @example
 * products.map((product, index) => (
 *   <div key={getItemKey(product, index, 'product')}>
 *     {product.name}
 *   </div>
 * ))
 */
export function getItemKey<T extends { id?: number | string }>(
    item: T,
    index: number,
    prefix: string = 'item'
): string {
    if (item.id !== undefined && item.id !== null) {
        return String(item.id);
    }
    return `${prefix}-${index}`;
}

/**
 * Add stable IDs to array items that don't have them
 *
 * @param items - Array of items
 * @param idField - Field name for the generated ID (default: '_key')
 * @param prefix - Prefix for generated IDs
 * @returns Array with added _key property
 *
 * @example
 * const categoriesWithKeys = withStableIds(categories, '_key', 'category');
 * categoriesWithKeys.map(cat => (
 *   <div key={cat._key}>{cat.name}</div>
 * ))
 */
export function withStableIds<T>(
    items: T[],
    idField: string = '_key',
    prefix: string = 'item'
): Array<T & { [key: string]: string }> {
    return items.map((item, index) => ({
        ...item,
        [idField]: generateUniqueId(`${prefix}-${index}`)
    }));
}

/**
 * Create a composite key from multiple values
 *
 * @param parts - Parts to combine into a key
 * @returns Composite key string
 *
 * @example
 * const key = compositeKey(orderId, itemId); // '123-456'
 */
export function compositeKey(...parts: (string | number | undefined)[]): string {
    return parts.filter(p => p !== undefined && p !== null).join('-');
}

/**
 * Generate a hash code from a string (for stable keys from content)
 *
 * @param str - String to hash
 * @returns Hash code as string
 *
 * @example
 * const key = hashCode(JSON.stringify(item)); // 'hash-123456'
 */
export function hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `hash-${Math.abs(hash)}`;
}
