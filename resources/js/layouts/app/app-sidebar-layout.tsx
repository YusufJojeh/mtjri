import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { CommandPalette } from '@/components/shell/command-palette';
import { MobileTabBar } from '@/components/shell/mobile-tab-bar';
import { useMerchantShell } from '@/components/shell/use-merchant-shell';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const safeBreadcrumbs = Array.isArray(breadcrumbs) ? breadcrumbs : [];
    const { groups, quickActions, isSuperAdmin } = useMerchantShell();

    return (
        <AppShell variant="sidebar">
            <a
                href="#main-content"
                className="bg-background focus:ring-ring sr-only z-[60] rounded-md px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:ring-2"
            >
                Skip to content
            </a>
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={safeBreadcrumbs} />
                <div id="main-content" tabIndex={-1} className="flex min-w-0 flex-1 flex-col outline-none max-md:pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
                    {children}
                </div>
            </AppContent>
            {!isSuperAdmin && (
                <>
                    <MobileTabBar groups={groups} />
                    <CommandPalette groups={groups} actions={quickActions} />
                </>
            )}
        </AppShell>
    );
}
