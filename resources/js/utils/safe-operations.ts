/**
 * Safe operation utilities for null/undefined handling
 *
 * These utilities provide safe ways to work with potentially null or undefined values,
 * preventing runtime errors and improving code reliability.
 */

/**
 * Safely map over arrays with null/undefined checks
 *
 * @param items - Array to map over (can be null/undefined)
 * @param callback - Mapping function to apply to each item
 * @returns Mapped array or empty array if items is null/undefined
 *
 * @example
 * const products = safeMap(data?.products, (product) => product.name);
 */
export function safeMap<T, R>(
    items: T[] | null | undefined,
    callback: (item: T, index: number) => R
): R[] {
    if (!items || !Array.isArray(items)) {
        return [];
    }
    return items.map(callback);
}

/**
 * Type guard to check if array has items
 *
 * @param arr - Array to check
 * @returns True if array exists and has items
 *
 * @example
 * if (hasItems(products)) {
 *   return products.map(p => <ProductCard key={p.id} product={p} />);
 * }
 */
export function hasItems<T>(arr: T[] | null | undefined): arr is T[] {
    return Array.isArray(arr) && arr.length > 0;
}

/**
 * Safely access nested object properties using dot notation
 *
 * @param obj - Object to access
 * @param path - Dot-separated path (e.g., "user.address.city")
 * @param defaultValue - Value to return if path doesn't exist
 * @returns Value at path or defaultValue
 *
 * @example
 * const city = safeGet(user, 'address.city', 'Unknown');
 */
export function safeGet<T>(
    obj: unknown,
    path: string,
    defaultValue?: T
): T | undefined {
    const keys = path.split('.');
    let result: any = obj;

    for (const key of keys) {
        if (result === null || result === undefined) {
            return defaultValue;
        }
        result = result[key];
    }

    return result ?? defaultValue;
}

/**
 * Safely return array with fallback to empty array
 *
 * @param value - Value that should be an array
 * @returns The array if valid, or empty array
 *
 * @example
 * const items = safeArray(data?.items);
 * items.forEach(item => console.log(item));
 */
export function safeArray<T>(value: T[] | null | undefined): T[] {
    return Array.isArray(value) ? value : [];
}

/**
 * Type guard for non-null/undefined values
 *
 * @param value - Value to check
 * @returns True if value is defined (not null or undefined)
 *
 * @example
 * const users = allUsers.filter(isDefined);
 */
export function isDefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

/**
 * Safely access array element by index
 *
 * @param arr - Array to access
 * @param index - Index to access
 * @param defaultValue - Value to return if index is out of bounds
 * @returns Element at index or defaultValue
 *
 * @example
 * const firstItem = safeArrayAccess(items, 0, null);
 */
export function safeArrayAccess<T>(
    arr: T[] | null | undefined,
    index: number,
    defaultValue?: T
): T | undefined {
    if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
        return defaultValue;
    }
    return arr[index] ?? defaultValue;
}

/**
 * Safely convert value to number
 *
 * @param value - Value to convert
 * @param defaultValue - Value to return if conversion fails
 * @returns Number or defaultValue
 *
 * @example
 * const price = safeNumber(product.price, 0);
 */
export function safeNumber(
    value: unknown,
    defaultValue: number = 0
): number {
    if (typeof value === 'number' && !isNaN(value)) {
        return value;
    }
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
}

/**
 * Safely convert value to string
 *
 * @param value - Value to convert
 * @param defaultValue - Value to return if value is null/undefined
 * @returns String representation or defaultValue
 *
 * @example
 * const name = safeString(user?.name, 'Anonymous');
 */
export function safeString(
    value: unknown,
    defaultValue: string = ''
): string {
    if (value === null || value === undefined) {
        return defaultValue;
    }
    return String(value);
}
