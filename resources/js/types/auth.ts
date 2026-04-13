/**
 * Authentication and authorization type definitions
 */

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    type?: 'admin' | 'customer' | 'vendor';
    current_store?: number | string;
    permissions?: string[]; // Added: Missing permissions field
    roles?: Role[];
    created_at?: string;
    updated_at?: string;
    email_verified_at?: string | null;
}

export interface Role {
    id: number;
    name: string;
    display_name?: string;
    description?: string;
    permissions: Permission[];
}

export interface Permission {
    id: number;
    name: string;
    display_name?: string;
    description?: string;
    group?: string;
}

export interface AuthState {
    user: User | null;
    permissions: string[]; // Added: Missing permissions array
    isAuthenticated: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
    remember?: boolean;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    terms?: boolean;
}

export interface ResetPasswordData {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface UpdateProfileData {
    name?: string;
    email?: string;
    avatar?: string;
    current_password?: string;
    password?: string;
    password_confirmation?: string;
}
