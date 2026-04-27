export type MarketingMetric = {
    value: string;
    label: string;
};

export type MarketingCompositionProps = {
    brandName: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    closingTitle: string;
    closingBody: string;
    proofPoints: string[];
    metrics: MarketingMetric[];
    themes: string[];
};

// Mirrors the public brand system used by the live landing page.
export const marketingPalette = {
    primary: '#1E90FF',
    secondary: '#1578D8',
    accent: '#FFC107',
    ambient: '#38BDF8',
    canvas: '#07111f',
    panel: '#0f172a',
    ink: '#e2e8f0',
    text: '#f8fafc',
    muted: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.12)',
    softBorder: 'rgba(148, 163, 184, 0.24)',
    glass: 'rgba(15, 23, 42, 0.58)',
    glassSoft: 'rgba(255, 255, 255, 0.08)',
} as const;

export const defaultMarketingProps: MarketingCompositionProps = {
    brandName: 'MTJRii',
    eyebrow: 'Built for founders, operators, and agencies running more than one storefront',
    title: 'Run multiple storefronts from one commerce control center',
    subtitle:
        'MTJRii combines multi-store management, theme selection, product operations, payments, content surfaces, and reporting so teams can launch and scale without stitching tools together.',
    primaryCta: 'Start setup',
    closingTitle: 'Launch faster and keep operations connected',
    closingBody:
        'The theme library, product surface, checkout flows, and store analytics stay inside one system instead of being spread across plugins and disconnected tools.',
    proofPoints: [
        'Company accounts, staff roles, and store switching from one workspace',
        'Custom domains, subdomains, and multilingual public pages',
        'Checkout, shipping, taxes, reviews, and growth tooling already wired in',
    ],
    metrics: [
        { value: '10', label: 'ready-made storefront themes' },
        { value: '30+', label: 'payment gateway flows in the product' },
        { value: '1', label: 'workspace for stores, orders, content, and analytics' },
    ],
    themes: [
        'Home Accessories',
        'Fashion',
        'Electronics & Gadgets',
        'Beauty & Cosmetics',
        'Jewelry',
        'Watches',
        'Furniture & Interior Design',
        'Cars & Automotive',
        'Baby & Kids',
        'Perfume & Fragrances',
    ],
};
