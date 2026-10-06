import '@testing-library/jest-dom';

// jsdom doesn't implement ResizeObserver, which Radix UI primitives (e.g.
// Switch) use internally to measure themselves on mount.
// eslint-disable-next-line no-undef
global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock Inertia.js global functions
// eslint-disable-next-line no-undef
global.route = (name, params = {}) => {
    let url = `/${name}`;
    if (Object.keys(params).length > 0) {
        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');
        url += `?${queryString}`;
    }
    return url;
};
// eslint-disable-next-line no-undef
global.Ziggy = {
    baseUrl: 'http://localhost',
    routeName: 'test-route',
    // ... other necessary Ziggy properties
};
// Mock any other global variables or functions that your components might use (e.g., `t` for i18n)
// global.t = (key) => key; // Simple mock for translation
