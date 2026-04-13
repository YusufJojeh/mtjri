/**
 * Form field and validation type definitions
 */

export interface FormField {
    name: string;
    label: string;
    type: FormFieldType;
    placeholder?: string;
    required?: boolean;
    defaultValue?: unknown; // Added: Missing defaultValue field
    options?: SelectOption[];
    validation?: FieldValidation;
    description?: string;
    disabled?: boolean;
    multiple?: boolean;
    accept?: string; // For file inputs
    rows?: number; // For textareas
    min?: number;
    max?: number;
    step?: number;
    className?: string;
    dependencies?: FieldDependency[];
}

export type FormFieldType =
    | 'text'
    | 'email'
    | 'password'
    | 'select'
    | 'textarea'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'date'
    | 'datetime-local'
    | 'time' // Added: Missing time type
    | 'number'
    | 'tel'
    | 'url'
    | 'color'
    | 'range'
    | 'multi-select'
    | 'media-picker'
    | 'rich-text'
    | 'toggle'
    | 'switch';

export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
    group?: string;
}

export interface FieldValidation {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: (value: unknown) => boolean | string;
    message?: string;
}

export interface FieldDependency {
    field: string;
    value: any;
    operator?: 'equals' | 'not_equals' | 'in' | 'not_in';
}

export interface FormErrors {
    [key: string]: string | string[];
}

export interface FormState<T = any> {
    data: T;
    errors: FormErrors;
    processing: boolean;
    recentlySuccessful: boolean;
    isDirty: boolean;
}

export interface ValidationRule {
    required?: boolean | string;
    email?: boolean | string;
    min?: number | { value: number; message: string };
    max?: number | { value: number; message: string };
    minLength?: number | { value: number; message: string };
    maxLength?: number | { value: number; message: string };
    pattern?: RegExp | { value: RegExp; message: string };
    validate?: (value: any) => boolean | string;
}

export type ValidationRules<T> = {
    [K in keyof T]?: ValidationRule;
};
