export type ThemePreview = {
    id: string;
    name: string;
    src: string;
};

export const marketingAssets = {
    logos: {
        dark: 'remotion/assets/logos/logo-dark.png',
        light: 'remotion/assets/logos/logo-light.png',
    },
    landing: {
        dashboard: 'remotion/assets/landing-page/multi-store-dashboard.png',
        themes: 'remotion/assets/landing-page/theme-selection.png',
        products: 'remotion/assets/landing-page/product-management.png',
        orders: 'remotion/assets/landing-page/order-management.png',
        payments: 'remotion/assets/landing-page/payment-integration.png',
        blog: 'remotion/assets/landing-page/blog-management.png',
    },
    themes: [
        { id: 'home-accessories', name: 'Home Accessories', src: 'remotion/assets/themes/home-accessories.png' },
        { id: 'fashion', name: 'Fashion', src: 'remotion/assets/themes/fashion.png' },
        { id: 'electronics', name: 'Electronics & Gadgets', src: 'remotion/assets/themes/electronics.png' },
        { id: 'beauty-cosmetics', name: 'Beauty & Cosmetics', src: 'remotion/assets/themes/beauty-cosmetics.png' },
        { id: 'jewelry', name: 'Jewelry', src: 'remotion/assets/themes/jewelry.png' },
        { id: 'watches', name: 'Watches', src: 'remotion/assets/themes/watches.png' },
        {
            id: 'furniture-interior',
            name: 'Furniture & Interior Design',
            src: 'remotion/assets/themes/furniture-interior.png',
        },
        { id: 'cars-automotive', name: 'Cars & Automotive', src: 'remotion/assets/themes/cars-automotive.png' },
        { id: 'baby-kids', name: 'Baby & Kids', src: 'remotion/assets/themes/baby-kids.png' },
        {
            id: 'perfume-fragrances',
            name: 'Perfume & Fragrances',
            src: 'remotion/assets/themes/perfume-fragrances.png',
        },
    ] satisfies ThemePreview[],
};
