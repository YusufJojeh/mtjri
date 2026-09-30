import { useSidebar } from '@/components/ui/sidebar';
import { ProfileMenu } from '@/components/profile-menu';
import { usePage, router, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ExternalLink, PanelLeft, Plus, Search } from 'lucide-react';
import { openCommandPalette } from '@/components/shell/command-palette';
import { useMerchantShell } from '@/components/shell/use-merchant-shell';
import { NotificationBell } from '@/components/tijraa/notifications';

export function AppSidebarHeader({ breadcrumbs: _breadcrumbs }: { breadcrumbs?: unknown }) {
    const { t } = useTranslation();
    const { toggleSidebar, state } = useSidebar();
    const page = usePage();
    const { quickActions, currentStore, isSuperAdmin } = useMerchantShell();
    const isImpersonating = (page.props as { isImpersonating?: boolean }).isImpersonating;
    const createActions = quickActions.filter((a) => !a.external);

    return (
        <header className="bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur sm:px-4">
            <Button
                variant="ghost"
                size="icon"
                className="hidden size-8 md:inline-flex"
                onClick={toggleSidebar}
                aria-label={state === 'expanded' ? t('Collapse Sidebar') : t('Expand Sidebar')}
                aria-keyshortcuts="Control+B"
            >
                <PanelLeft className="size-4 rtl:-scale-x-100" />
            </Button>

            {/* Phone: store identity takes the leading slot */}
            <div className="min-w-0 flex-1 md:hidden">
                <p className="truncate text-sm font-semibold">{currentStore?.name ?? ''}</p>
            </div>
            <div className="hidden flex-1 md:block" />

            <div className="flex items-center gap-1.5">
                {!isSuperAdmin && (
                    <Button variant="ghost" size="icon" className="size-9 md:hidden" onClick={openCommandPalette} aria-label={t('Search')}>
                        <Search className="size-[18px]" />
                    </Button>
                )}

                {isImpersonating && (
                    <Button size="sm" variant="destructive" onClick={() => router.post(route('impersonate.leave'))}>
                        {t('Return Back')}
                    </Button>
                )}

                {createActions.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" className="h-8 gap-1.5 px-2.5 max-sm:size-9 max-sm:px-0" aria-label={t('Create')}>
                                <Plus className="size-4" />
                                <span className="hidden sm:inline">{t('Create')}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel className="text-muted-foreground text-xs">{t('Create')}</DropdownMenuLabel>
                            {createActions.map((a) => (
                                <DropdownMenuItem key={a.id} asChild>
                                    <Link href={a.href} className="flex items-center gap-2 [&_svg]:size-4">
                                        {a.icon}
                                        {a.label}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {currentStore?.slug && (
                    <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground hidden h-8 gap-1.5 px-2.5 sm:inline-flex">
                        <a href={route('store.home', { storeSlug: currentStore.slug })} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-4" />
                            <span className="hidden lg:inline">{t('View store')}</span>
                        </a>
                    </Button>
                )}

                {!isSuperAdmin && <NotificationBell />}

                <ProfileMenu />
            </div>
        </header>
    );
}
