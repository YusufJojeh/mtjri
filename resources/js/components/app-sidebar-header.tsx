import { useSidebar } from '@/components/ui/sidebar';
import { useLayout } from '@/contexts/LayoutContext';
import { ProfileMenu } from '@/components/profile-menu';
import { usePage, router, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { StoreSwitcher } from '@/components/store-switcher';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ExternalLink, PanelLeft, PanelRight, Store } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs }: { breadcrumbs?: never }) {
    const { t } = useTranslation();
    const { position } = useLayout();
    const { toggleSidebar, state } = useSidebar();
    const page = usePage();

    // Ensure stores is always an array
    const stores = (page.props as any).stores;
    const safeStores = Array.isArray(stores) ? stores : [];
    const currentStore = safeStores.find((store: any) => String(store.id) === String((page.props as any).auth?.user?.current_store)) || (safeStores.length > 0 ? safeStores[0] : null);

    return (
        <>
            <header className="border-sidebar-border/50 flex h-12 sm:h-14 shrink-0 items-center gap-2 sm:gap-3 border-b px-3 sm:px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex w-full items-center justify-between min-w-0 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    {/* Sidebar Toggle Button - Moved to left side */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-[44px] min-w-[44px] h-[44px] w-[44px] sm:h-9 sm:w-9"
                        onClick={toggleSidebar}
                        title={state === 'expanded' ? t('Collapse Sidebar') : t('Expand Sidebar')}
                    >
                        {state === 'expanded' ? (
                            <PanelLeft className="h-5 w-5 sm:h-4 sm:w-4" />
                        ) : (
                            <PanelRight className="h-5 w-5 sm:h-4 sm:w-4" />
                        )}
                        <span className="sr-only">{state === 'expanded' ? t('Collapse Sidebar') : t('Expand Sidebar')}</span>
                    </Button>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                    {/* Store Switcher - Hide for superadmin, compact on mobile */}
                    {(page.props as any).auth?.user?.type !== 'superadmin' && (page.props as any).auth?.user?.type !== 'super admin' && (
                        <div className="hidden sm:block">
                            <StoreSwitcher
                                items={safeStores}
                                currentStore={currentStore}
                            />
                        </div>
                    )}

                    {(page.props as any).isImpersonating && (
                        <button
                            onClick={() => router.post(route('impersonate.leave'))}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 min-h-[44px] sm:min-h-0 whitespace-nowrap"
                        >
                            {t("Return Back")}
                        </button>
                    )}
                    {/* Visit Store Dropdown - First element */}
                    {safeStores.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-2 min-h-[44px] sm:min-h-0"
                                >
                                    <Store className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t('Visit Store')}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {safeStores.length === 1 ? (
                                    <DropdownMenuItem asChild>
                                        <Link 
                                            href={route('store.home', { storeSlug: safeStores[0].slug })}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            <span className="truncate">{safeStores[0].name}</span>
                                        </Link>
                                    </DropdownMenuItem>
                                ) : (
                                    safeStores.map((store: any) => (
                                        <DropdownMenuItem key={store.id} asChild>
                                            <Link 
                                                href={route('store.home', { storeSlug: store.slug })}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                <span className="truncate">{store.name}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    {/* Profile Menu */}
                    <ProfileMenu />
                </div>
            </div>
        </header>
        </>
    );
}
