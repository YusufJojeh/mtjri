/**
 * Inertia.js-specific type definitions
 */

import React from 'react';
import { Page, PageProps as InertiaPageProps } from '@inertiajs/core';
import { User } from './auth';
import { Store } from './store';

/**
 * Shared props available on all Inertia pages
 */
export interface SharedProps {
    auth: {
        user: User | null;
        permissions: string[]; // Added: Missing permissions field
    };
    flash: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
        message?: string;
    };
    appName: string;
    locale: string;
    locales?: string[];
    store?: Store;
    stores?: Store[];
    csrf_token: string;
    errors?: Record<string, string>;
    [key: string]: any;
}

/**
 * Enhanced PageProps that includes SharedProps
 */
export type PageProps<T = Record<string, unknown>> = InertiaPageProps & SharedProps & T;

/**
 * Type for Inertia page component props
 */
export interface InertiaPageComponentProps<T = Record<string, unknown>> {
    (props: PageProps<T>): React.ReactElement;
}

/**
 * Form data type for Inertia forms
 */
export interface InertiaFormProps<TForm = Record<string, any>> {
    data: TForm;
    setData: (key: keyof TForm | Partial<TForm> | ((data: TForm) => TForm), value?: any) => void;
    post: (url: string, options?: any) => void;
    put: (url: string, options?: any) => void;
    patch: (url: string, options?: any) => void;
    delete: (url: string, options?: any) => void;
    get: (url: string, options?: any) => void;
    transform: (callback: (data: TForm) => any) => void;
    reset: (...fields: (keyof TForm)[]) => void;
    clearErrors: (...fields: (keyof TForm)[]) => void;
    setError: (field: keyof TForm | Record<keyof TForm, string>, value?: string) => void;
    processing: boolean;
    progress: { percentage: number; } | null;
    errors: Partial<Record<keyof TForm, string>>;
    hasErrors: boolean;
    recentlySuccessful: boolean;
    wasSuccessful: boolean;
    isDirty: boolean;
}

/**
 * Visit options for Inertia router
 */
export interface InertiaVisitOptions {
    method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
    data?: Record<string, any>;
    replace?: boolean;
    preserveState?: boolean | ((page: Page) => boolean);
    preserveScroll?: boolean | ((page: Page) => boolean);
    only?: string[];
    headers?: Record<string, string>;
    errorBag?: string;
    forceFormData?: boolean;
    onCancelToken?: (cancelToken: any) => void;
    onBefore?: (visit: any) => void;
    onStart?: (visit: any) => void;
    onProgress?: (progress: { percentage: number }) => void;
    onSuccess?: (page: Page) => void;
    onError?: (errors: Record<string, string>) => void;
    onCancel?: () => void;
    onFinish?: () => void;
}
