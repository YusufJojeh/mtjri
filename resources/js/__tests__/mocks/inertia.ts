/**
 * Mock implementations for Inertia.js hooks and components
 * Use these in your tests to avoid actual routing and form submissions
 */

import { jest } from '@jest/globals';

/**
 * Mock Inertia router
 */
export const mockInertiaRouter = {
    visit: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    reload: jest.fn(),
    replace: jest.fn(),
    remember: jest.fn(),
    restore: jest.fn(),
    on: jest.fn(),
    cancel: jest.fn(),
};

/**
 * Mock usePage hook
 *
 * @param props - Page props to return
 * @returns Mock page object
 */
export const mockUsePage = <T = any>(props?: Partial<T>) => {
    const defaultProps = {
        auth: {
            user: {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                permissions: ['view-dashboard']
            },
            permissions: ['view-dashboard']
        },
        appName: 'Test App',
        locale: 'en',
        flash: {},
        csrf_token: 'test-csrf-token',
    };

    return {
        props: {
            ...defaultProps,
            ...props
        } as T,
        url: '/test',
        component: 'Test',
        version: '1.0',
        scrollRegions: [],
        rememberedState: {},
    };
};

/**
 * Mock useForm hook
 *
 * @param initialData - Initial form data
 * @param overrides - Override specific methods/properties
 * @returns Mock form object
 */
export const mockUseForm = <T = any>(
    initialData: T,
    overrides: Partial<ReturnType<typeof mockUseForm>> = {}
) => {
    const setData = jest.fn();
    const post = jest.fn();
    const put = jest.fn();
    const patch = jest.fn();
    const deleteMethod = jest.fn();
    const get = jest.fn();
    const transform = jest.fn();
    const reset = jest.fn();
    const clearErrors = jest.fn();
    const setError = jest.fn();

    return {
        data: initialData,
        setData,
        post,
        put,
        patch,
        delete: deleteMethod,
        get,
        transform,
        reset,
        clearErrors,
        setError,
        processing: false,
        progress: null,
        errors: {},
        hasErrors: false,
        recentlySuccessful: false,
        wasSuccessful: false,
        isDirty: false,
        ...overrides
    };
};

/**
 * Mock useRemember hook
 *
 * @param initialData - Initial data to remember
 * @param key - Storage key
 * @returns Tuple of [data, setData]
 */
export const mockUseRemember = <T = any>(initialData: T, key: string) => {
    const setData = jest.fn();
    return [initialData, setData] as [T, typeof setData];
};

/**
 * Setup Inertia mocks for jest
 * Call this in your jest setup file or at the top of test files
 */
export const setupInertiaMocks = () => {
    jest.mock('@inertiajs/react', () => ({
        useForm: jest.fn(() => mockUseForm({})),
        usePage: jest.fn(() => mockUsePage()),
        useRemember: jest.fn((data: any, key: string) => mockUseRemember(data, key)),
        router: mockInertiaRouter,
        Head: ({ title, children }: any) => {
            return null; // Mock Head component
        },
        Link: ({ children, href, ...props }: any) => {
            return null; // Mock Link component
        },
    }));
};

/**
 * Reset all Inertia mocks
 * Call this in beforeEach or afterEach hooks
 */
export const resetInertiaMocks = () => {
    Object.values(mockInertiaRouter).forEach(fn => {
        if (typeof fn === 'function' && 'mockClear' in fn) {
            fn.mockClear();
        }
    });
};
