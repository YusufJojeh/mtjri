/**
 * Mock product data for testing
 */

import { Product, Category } from '@/types/store';

export const mockCategory: Category = {
    id: 1,
    name: 'Electronics',
    slug: 'electronics',
};

export const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    price: 99.99,
    sale_price: 79.99,
    cover_image: '/images/products/test-product.jpg',
    image: '/images/products/test-product.jpg',
    description: 'This is a test product description',
    stock: 50,
    is_active: true,
    category: mockCategory,
    rating: 4.5,
    reviews_count: 10,
    average_rating: 4.5,
    total_reviews: 10,
};

export const mockProducts: Product[] = [
    mockProduct,
    {
        id: 2,
        name: 'Another Product',
        slug: 'another-product',
        price: 149.99,
        sale_price: null,
        cover_image: '/images/products/another-product.jpg',
        description: 'Another test product',
        stock: 25,
        is_active: true,
        category: mockCategory,
        rating: 4.0,
        reviews_count: 5,
    },
    {
        id: 3,
        name: 'Out of Stock Product',
        slug: 'out-of-stock',
        price: 29.99,
        stock: 0,
        is_active: false,
        category: mockCategory,
    },
];

export const mockProductVariants = {
    size: ['Small', 'Medium', 'Large'],
    color: ['Red', 'Blue', 'Green'],
};

export const mockProductWithVariants: Product = {
    ...mockProduct,
    id: 4,
    name: 'Product with Variants',
    variants: mockProductVariants,
};
