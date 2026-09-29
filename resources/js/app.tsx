import '@fontsource-variable/instrument-sans/index.css';
import '../css/app.css';
import '../css/dark-mode.css';

// Explicitly import React to ensure it's available globally for vendor bundles
import React from 'react';

// Make React available globally for vendor bundles that need it
if (typeof window !== 'undefined') {
    try {
        if (window === window.self && window.self === window.top) {
            // Check if we can safely define properties
            const testObj = {};
            try {
                Object.defineProperty(testObj, 'test', { value: 'test', configurable: true });
                // If we can define properties, try to set React on window
                Object.defineProperty(window, 'React', {
                    value: React,
                    writable: true,
                    configurable: true,
                    enumerable: false
                });
            } catch (e) {
                // Fallback to direct assignment if defineProperty fails
                (window as any).React = React;
            }
        }
    } catch (e) {
        // Ignore cross-origin errors
    }
}

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import { LayoutProvider } from './contexts/LayoutContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { BrandProvider } from './contexts/BrandContext';
import { ModalStackProvider } from './contexts/ModalStackContext';
import { initializeTheme } from './hooks/use-appearance';
import { CustomToast, toast } from './components/custom-toast';
import { initializeGlobalSettings } from './utils/globalSettings';
import { initPerformanceMonitoring, lazyLoadImages } from './utils/performance';
import { setupFlashMessages } from './utils/flash-messages';
import './i18n'; // Import i18n configuration
import './utils/axios-config'; // Import axios configuration

// Initialize performance monitoring
initPerformanceMonitoring();

// Handle demo mode globally
const isDemoMode = (): boolean => {
    try {
        if (typeof window !== 'undefined' && window === window.self) {
            const isDemo = (window as any).isDemo;
            if (isDemo !== undefined) return isDemo;
            
            try {
                const page = (window as any).page;
                if (page?.props?.is_demo !== undefined) {
                    return page.props.is_demo;
                }
            } catch (e) {
                // Ignore cross-origin errors
            }
        }
    } catch (e) {
        // Ignore errors
    }
    return false;
};

const demoModeMessage = 'This action is disabled in demo mode. You can only create new data, not modify existing demo data.';

router.on('start', (event) => {
    const method = event.detail.visit.method.toLowerCase();
    if (isDemoMode() && ['put', 'patch', 'delete'].includes(method)) {
        event.preventDefault();
        // Use toast from custom-toast which is already imported
        toast.error(demoModeMessage, { duration: 5000 });
    }
});

// Initialize lazy loading of images when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    lazyLoadImages();
});

// Add event listener for theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    // Re-apply theme when system preference changes
    const savedTheme = localStorage.getItem('themeSettings');
    if (savedTheme) {
        const themeSettings = JSON.parse(savedTheme);
        if (themeSettings.appearance === 'system') {
            initializeTheme();
        }
    }
});

const appName = import.meta.env.VITE_APP_NAME || 'Tijraa';

createInertiaApp({
    title: (title) => {
        // Get dynamic title text from shared props
        let dynamicTitle = appName;
        try {
            if (typeof window !== 'undefined' && window === window.self) {
                try {
                    const page = (window as any).page;
                    if (page?.props?.dynamicTitleText) {
                        dynamicTitle = page.props.dynamicTitleText;
                    }
                } catch (e) {
                    // Ignore cross-origin errors
                }
            }
        } catch (e) {
            // Ignore errors
        }
        return title ? `${title} - ${dynamicTitle}` : dynamicTitle;
    },    
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx');
        // Filter out test files
        const filteredPages: Record<string, any> = {};
        for (const [path, module] of Object.entries(pages)) {
            if (!path.includes('__tests__') && !path.includes('.test.') && !path.includes('.spec.')) {
                filteredPages[path] = module;
            }
        }
        return resolvePageComponent(`./pages/${name}.tsx`, filteredPages);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        
        // Make page data globally available for axios interceptor
        // Use safe property assignment to avoid cross-origin errors in Firefox
        try {
            if (typeof window !== 'undefined' && window === window.self && window.self === window.top) {
                // Check if we can safely set properties on window
                try {
                    // Test if Object.defineProperty works on a test object first
                    const testObj = {};
                    Object.defineProperty(testObj, 'test', { value: 'test', configurable: true });
                    
                    // If test passes, try to set page on window
                    Object.defineProperty(window, 'page', {
                        value: props.initialPage,
                        writable: true,
                        configurable: true,
                        enumerable: false
                    });
                } catch (e) {
                    // Fallback to direct assignment if defineProperty fails
                    try {
                        (window as any).page = props.initialPage;
                    } catch (e2) {
                        // Silently ignore if both methods fail (cross-origin restriction)
                    }
                }
            }
        } catch (e) {
            // Silently ignore cross-origin errors
        }
        
        // Set demo mode globally
        try {
            if (typeof window !== 'undefined' && window === window.self && window.self === window.top) {
                try {
                    // Test if Object.defineProperty works on a test object first
                    const testObj = {};
                    Object.defineProperty(testObj, 'test', { value: 'test', configurable: true });
                    
                    // If test passes, try to set isDemo on window
                    Object.defineProperty(window, 'isDemo', {
                        value: props.initialPage.props?.is_demo || false,
                        writable: true,
                        configurable: true,
                        enumerable: false
                    });
                } catch (e) {
                    // Fallback to direct assignment if defineProperty fails
                    try {
                        (window as any).isDemo = props.initialPage.props?.is_demo || false;
                    } catch (e2) {
                        // Silently ignore if both methods fail (cross-origin restriction)
                    }
                }
            }
        } catch (e) {
            // Silently ignore errors
        }
        
        // Initialize global settings from shared data
        const pageProps = props.initialPage.props as Record<string, any>;
        const globalSettings = pageProps.globalSettings || {};
        if (Object.keys(globalSettings).length > 0) {
            initializeGlobalSettings(globalSettings);
            
            // Set initial document title using dynamic title text
            const dynamicTitle = pageProps.dynamicTitleText || (globalSettings as any).titleText || appName;
            document.title = dynamicTitle;
        }
        
        // Always initialize theme with available settings
        initializeTheme(globalSettings);
        
        // Initialize flash message handling
        setupFlashMessages();

        // Create a memoized render function to prevent unnecessary re-renders
        const renderApp = (appProps: any) => {
            const currentPageProps = appProps.initialPage.props as Record<string, any>;
            const currentGlobalSettings = currentPageProps.globalSettings || {};
            const user = appProps.initialPage.props.auth?.user;
            
            return (
                <ModalStackProvider>
                    <LayoutProvider>
                        <SidebarProvider>
                            <BrandProvider globalSettings={currentGlobalSettings} user={user}>
                                <Suspense fallback={<div className='flex h-screen w-full items-center justify-center'>Loading...</div>}>
                                    <App {...appProps} />
                                </Suspense>
                                <CustomToast />
                            </BrandProvider>
                        </SidebarProvider>
                    </LayoutProvider>
                </ModalStackProvider>
            );
        };
        
        // Initial render
        root.render(renderApp(props));
        
        // Update global page data on navigation and re-render with new settings
        router.on('navigate', (event) => {
            try {
                // Update global page data safely
                try {
                    if (typeof window !== 'undefined' && window === window.self && window.self === window.top) {
                        try {
                            // Test if Object.defineProperty works on a test object first
                            const testObj = {};
                            Object.defineProperty(testObj, 'test', { value: 'test', configurable: true });
                            
                            // If test passes, try to set page on window
                            Object.defineProperty(window, 'page', {
                                value: event.detail.page,
                                writable: true,
                                configurable: true,
                                enumerable: false
                            });
                        } catch (e) {
                            // Fallback to direct assignment if defineProperty fails
                            try {
                                (window as any).page = event.detail.page;
                            } catch (e2) {
                                // Silently ignore if both methods fail (cross-origin restriction)
                            }
                        }
                    }
                } catch (e) {
                    // Silently ignore cross-origin errors
                }
                
                // Re-initialize global settings with updated data
                const updatedPageProps = event.detail.page.props as Record<string, any>;
                const updatedGlobalSettings = updatedPageProps.globalSettings || {};
                if (Object.keys(updatedGlobalSettings).length > 0) {
                    initializeGlobalSettings(updatedGlobalSettings);
                    
                    // Update document title using dynamic title text
                    const dynamicTitle = event.detail.page.props.dynamicTitleText || updatedGlobalSettings.titleText || appName;
                    document.title = dynamicTitle;
                }
                
                // Re-render with updated props including globalSettings
                root.render(renderApp({ initialPage: event.detail.page }));
                
                // Force dark mode check on navigation
                const savedTheme = localStorage.getItem('themeSettings');
                if (savedTheme) {
                    const themeSettings = JSON.parse(savedTheme);
                    const isDark = themeSettings.appearance === 'dark' || 
                        (themeSettings.appearance === 'system' && 
                         window.matchMedia('(prefers-color-scheme: dark)').matches);
                    document.documentElement.classList.toggle('dark', isDark);
                    document.body.classList.toggle('dark', isDark);
                }
            } catch (e) {
                console.error('Navigation error:', e);
            }
        });
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

// Initialize direction from localStorage if available
const initializeDirection = () => {
    const savedDirection = localStorage.getItem('layoutDirection');
    if (savedDirection) {
        document.documentElement.dir = savedDirection;
        document.documentElement.setAttribute('dir', savedDirection);
    }
};

// Initialize direction on page load
initializeDirection();