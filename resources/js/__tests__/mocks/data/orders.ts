/**
 * Mock order data for testing
 */

import { Order, OrderItem, Address } from '@/types/store';
import { mockProduct } from './products';

export const mockAddress: Address = {
    name: 'John Doe',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'USA',
};

export const mockOrderItem: OrderItem = {
    id: 1,
    product_id: mockProduct.id,
    name: mockProduct.name,
    price: mockProduct.price,
    quantity: 2,
    total: mockProduct.price * 2,
    cover_image: mockProduct.cover_image,
    product: mockProduct,
};

export const mockOrder: Order = {
    id: 1,
    order_number: 'ORD-001',
    date: '2024-01-15',
    status: 'completed',
    subtotal: 199.98,
    discount: 20.00,
    shipping: 10.00,
    tax: 15.00,
    total: 204.98,
    items: [mockOrderItem],
    shipping_address: mockAddress,
    billing_address: mockAddress,
    payment_method: 'credit_card',
    shipping_method: 'standard',
};

export const mockOrders: Order[] = [
    mockOrder,
    {
        id: 2,
        order_number: 'ORD-002',
        date: '2024-01-14',
        status: 'processing',
        subtotal: 299.97,
        discount: 0,
        shipping: 10.00,
        tax: 22.50,
        total: 332.47,
        items: [
            {
                ...mockOrderItem,
                id: 2,
                quantity: 3,
                total: mockProduct.price * 3,
            },
        ],
        shipping_address: mockAddress,
        payment_method: 'paypal',
    },
    {
        id: 3,
        order_number: 'ORD-003',
        date: '2024-01-13',
        status: 'pending',
        subtotal: 99.99,
        discount: 0,
        shipping: 5.00,
        tax: 7.50,
        total: 112.49,
        items: [
            {
                ...mockOrderItem,
                id: 3,
                quantity: 1,
                total: mockProduct.price,
            },
        ],
        shipping_address: mockAddress,
        payment_method: 'stripe',
    },
];
