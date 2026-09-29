import tailwindcss from '@tailwindcss/vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

function stripUseClientDirective(): import('vite').Plugin {
  return {
    name: 'strip-use-client-directive',
    enforce: 'pre' as const,
    transform(code, id) {
      if (
        id.endsWith('.js') ||
        id.endsWith('.ts') ||
        id.endsWith('.tsx') ||
        id.endsWith('.mjs')
      ) {
        if (code.includes('"use client"') || code.includes("'use client'")) {
          return code.replace(/['"]use client['"];?\s*/g, '');
        }
      }
    },
  };
}

function excludeTestFiles(): import('vite').Plugin {
  return {
    name: 'exclude-test-files',
    enforce: 'pre' as const,
    resolveId(id) {
      // Exclude test files from the build
      if (id.includes('__tests__') || id.includes('.test.') || id.includes('.spec.')) {
        return { id: '\0virtual:test-excluded', external: false };
      }
      return null;
    },
    load(id) {
      // Return empty module for excluded test files
      if (id === '\0virtual:test-excluded') {
        return { code: 'export {};', map: null };
      }
      return null;
    },
  };
}

function fixEsToolkitImport(): import('vite').Plugin {
  return {
    name: 'fix-es-toolkit-import',
    enforce: 'pre' as const,
    resolveId(id) {
      // Intercept all es-toolkit/compat/* imports generically
      if (id.startsWith('es-toolkit/compat/')) {
        // Extract the function name from the path (e.g., 'uniqBy' from 'es-toolkit/compat/uniqBy')
        const functionName = id.replace('es-toolkit/compat/', '');
        // Return a virtual module ID
        return `\0es-toolkit-compat-${functionName}`;
      }
      return null;
    },
    load(id) {
      // Handle all es-toolkit/compat/* virtual modules
      if (id.startsWith('\0es-toolkit-compat-')) {
        // Extract the function name from the virtual module ID
        const functionName = id.replace('\0es-toolkit-compat-', '');
        // Provide a wrapper module that exports both default and named exports
        return {
          // recharts does `import get from 'es-toolkit/compat/get'`, but those
          // per-function files are CommonJS. Re-export from the package's ESM
          // compat entry instead (never emit `require` into browser code).
          code: `export { ${functionName} as default, ${functionName} } from 'es-toolkit/compat';`,
          map: null,
        };
      }
      return null;
    },
  };
}

function fixReactIsImport(): import('vite').Plugin {
  return {
    name: 'fix-react-is-import',
    enforce: 'pre' as const,
    resolveId(id) {
      // Intercept react-is imports
      if (id === 'react-is') {
        return '\0react-is-fixed';
      }
      return null;
    },
    load(id) {
      // Provide a wrapper module that properly exports react-is functions
      if (id === '\0react-is-fixed') {
        return {
          code: `
            // Import the CommonJS entry by path (bypasses this plugin's own
            // 'react-is' interception); Vite's commonjs transform provides the
            // default export. Never emit \`require\` into browser code.
            import reactIs from 'react-is/index.js';
            // Re-export all named exports for ES module compatibility
            export const isFragment = reactIs.isFragment;
            export const isMemo = reactIs.isMemo;
            export const isForwardRef = reactIs.isForwardRef;
            export const isLazy = reactIs.isLazy;
            export const isSuspense = reactIs.isSuspense;
            export const isValidElementType = reactIs.isValidElementType;
            export const typeOf = reactIs.typeOf;
            export const Fragment = reactIs.Fragment;
            export const StrictMode = reactIs.StrictMode;
            export const Profiler = reactIs.Profiler;
            export const Suspense = reactIs.Suspense;
            export const Memo = reactIs.Memo;
            export const ForwardRef = reactIs.ForwardRef;
            export const Lazy = reactIs.Lazy;
            // Also export default for compatibility
            export default reactIs;
          `,
          map: null,
        };
      }
      return null;
    },
  };
}


export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/css/dark-mode.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        excludeTestFiles(),
        stripUseClientDirective(),
        fixEsToolkitImport(),
        fixReactIsImport(),
        tailwindcss(),
    ],
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        cors: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
        hmr: {
            host: 'localhost',
        },
        watch: {
            ignored: ['**/vendor/**', '**/node_modules/**']
        }
    },

    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react',
        // Remove console statements in production (except console.error)
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    build: {
        // Increase chunk size warning limit to 1000kb (1MB) for large apps
        chunkSizeWarningLimit: 1000,
        // Enable source maps for production debugging (optional, can be disabled for smaller builds)
        sourcemap: false,
        // Minification optimizations
        minify: 'esbuild',
        // Enable CSS code splitting
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                // Better chunk naming for debugging
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
                manualChunks: (id) => {
                    // Node modules vendor chunk
                    if (id.includes('node_modules')) {
                        // React core libraries - include in main app bundle to ensure it loads before vendor chunks
                        // This prevents "createContext" errors when vendor chunks try to access React
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react/jsx-runtime')) {
                            return undefined; // Include in main app bundle instead of separate chunk
                        }
                        // Inertia.js
                        if (id.includes('@inertiajs')) {
                            return 'vendor-inertia';
                        }
                        // Radix UI components (large UI library)
                        if (id.includes('@radix-ui')) {
                            return 'vendor-radix';
                        }
                        // TipTap editor (large rich text editor)
                        if (id.includes('@tiptap') || id.includes('prosemirror')) {
                            return 'vendor-tiptap';
                        }
                        // Recharts (large charting library)
                        if (id.includes('recharts')) {
                            return 'vendor-charts';
                        }
                        // Stripe payment library
                        if (id.includes('@stripe')) {
                            return 'vendor-stripe';
                        }
                        // FullCalendar
                        if (id.includes('@fullcalendar')) {
                            return 'vendor-calendar';
                        }
                        // i18n libraries
                        if (id.includes('i18next') || id.includes('react-i18next')) {
                            return 'vendor-i18n';
                        }
                        // Date utilities
                        if (id.includes('date-fns')) {
                            return 'vendor-dates';
                        }
                        // Other large dependencies
                        if (id.includes('lucide-react')) {
                            return 'vendor-icons';
                        }
                        // All other node_modules
                        return 'vendor';
                    }
                },
            },
        },
        assetsDir: 'assets',
        // Optimize dependencies
        commonjsOptions: {
            include: [/node_modules/],
        },
    },
    // Production optimizations
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@inertiajs/react',
            'react-is',
            'recharts',
        ],
        exclude: ['@tiptap', '@fullcalendar'],
    },
});
