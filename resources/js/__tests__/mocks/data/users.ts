/**
 * Mock user and authentication data for testing
 */

import { User, Role, Permission } from '@/types/auth';

export const mockPermission: Permission = {
    id: 1,
    name: 'view-dashboard',
    display_name: 'View Dashboard',
    description: 'Can view the dashboard',
    group: 'dashboard',
};

export const mockRole: Role = {
    id: 1,
    name: 'admin',
    display_name: 'Administrator',
    description: 'Full system access',
    permissions: [mockPermission],
};

export const mockUser: User = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    avatar: '/images/avatars/default.png',
    type: 'admin',
    current_store: 1,
    permissions: ['view-dashboard', 'manage-products', 'manage-orders'],
    roles: [mockRole],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
};

export const mockCustomerUser: User = {
    id: 2,
    name: 'Customer User',
    email: 'customer@example.com',
    type: 'customer',
    permissions: ['view-profile', 'place-orders'],
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
};

export const mockVendorUser: User = {
    id: 3,
    name: 'Vendor User',
    email: 'vendor@example.com',
    type: 'vendor',
    current_store: 2,
    permissions: ['manage-store', 'manage-products', 'view-orders'],
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
};

export const mockUsers: User[] = [
    mockUser,
    mockCustomerUser,
    mockVendorUser,
];
