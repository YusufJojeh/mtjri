/**
 * Custom testing utilities that wrap @testing-library/react
 * with application-specific providers and utilities
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

// Note: Import actual providers as needed
// import { BrandProvider } from '@/contexts/BrandContext';
// import { LayoutProvider } from '@/contexts/LayoutContext';
// import { CartProvider } from '@/contexts/CartContext';
// import { WishlistProvider } from '@/contexts/WishlistContext';

/**
 * All the providers wrapper for testing
 * This wraps components with all necessary context providers
 */
export const AllTheProviders = ({ children }: { children: ReactNode }) => {
    // Add all necessary providers here
    // For now, just return children - update as we add tests
    return <>{children}</>;

    // Example with providers:
    // return (
    //     <BrandProvider>
    //         <LayoutProvider>
    //             <CartProvider storeId={1} isLoggedIn={true}>
    //                 <WishlistProvider>
    //                     {children}
    //                 </WishlistProvider>
    //             </CartProvider>
    //         </LayoutProvider>
    //     </BrandProvider>
    // );
};

/**
 * Custom render function that includes providers
 * Use this instead of the default render from @testing-library/react
 *
 * @example
 * render(<MyComponent />, { wrapper: AllTheProviders });
 */
export const renderWithProviders = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

/**
 * Create a mock Inertia page props object
 *
 * @param overrides - Properties to override
 * @returns Mock page props
 */
export const createMockPageProps = (overrides: any = {}) => ({
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
    csrf_token: 'test-token',
    ...overrides
});

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Export our custom render as the default render
export { renderWithProviders as render };
