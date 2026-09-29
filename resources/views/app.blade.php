<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
		
        @if (config('services.gtm.id'))
            {{-- Google Tag Manager (opt-in via GTM_ID) --}}
            <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer',@json(config('services.gtm.id')));</script>
        @endif

        <meta name="application-name" content="Tijraa">
        <meta name="apple-mobile-web-app-title" content="Tijraa">
        <meta name="theme-color" content="#0B6B5A">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="apple-touch-icon" href="/images/logos/icon-192x192.png">
        <link rel="manifest" href="/manifest.webmanifest">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
                
                // Set demo mode flag
                window.isDemo = {{ config('app.is_demo') ? 'true' : 'false' }};
                
                // Set base URL for image helper
                window.appSettings = {
                    baseUrl: '{{ config('app.url') }}'
                };
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(0.985 0.002 247);
            }

            html.dark {
                background-color: oklch(0.16 0.006 256);
            }
        </style>

        <title inertia>{{ getSetting('titleText', config('app.name', 'Tijraa')) }}</title>

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
		
        @if (config('services.gtm.id'))
            <noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ config('services.gtm.id') }}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        @endif
		
        @inertia
    </body>
</html>
