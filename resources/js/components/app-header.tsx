import { Icon } from '@/components/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { BookOpen, ExternalLink, Folder, LayoutGrid, Menu, Search, Store } from 'lucide-react';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';
import { StoreSwitcher } from '@/components/store-switcher';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
        icon: LayoutGrid,
    },
];

const rightNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits',
        icon: BookOpen,
    },
];

const activeItemStyles = 'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

interface AppHeaderProps {
    breadcrumbs?: never;
}

export function AppHeader({}: AppHeaderProps) {
    const { t } = useTranslation();
    const page = usePage<SharedData>();
    const { auth, stores = [] } = page.props;
    const getInitials = useInitials();
    return (
        <>
            <div className="border-sidebar-border/80 border-b">
                <div className="mx-auto flex h-14 sm:h-16 items-center px-3 sm:px-4 md:max-w-7xl gap-2 sm:gap-4">
                    {/* Mobile Menu */}
                    <div className="lg:hidden flex-shrink-0">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] h-[44px] w-[44px]">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="bg-sidebar flex h-full w-64 flex-col items-stretch justify-between">
                                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            {mainNavItems.map((item) => (
                                                <Link key={item.title} href={item.href} className="flex items-center space-x-2 font-medium min-h-[44px]">
                                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                    <span>{item.title}</span>
                                                </Link>
                                            ))}
                                        </div>

                                        <div className="flex flex-col space-y-4">
                                            {rightNavItems.map((item) => (
                                                <a
                                                    key={item.title}
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-2 font-medium min-h-[44px]"
                                                >
                                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                    <span>{item.title}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link href={route("dashboard")} prefetch className="flex items-center space-x-2 flex-shrink-0 min-h-[44px]">
                        <AppLogo />
                    </Link>

                    {/* Store Switcher or Store Name - Hide on mobile, show on tablet+ */}
                    {(auth.user.type === 'company' || (auth.permissions && auth.permissions.includes('switch-stores'))) ? (
                        <div className="ml-2 sm:ml-4 hidden sm:flex items-center">
                            <StoreSwitcher
                                items={stores}
                                currentStore={stores.find(store => String(store.id) === String(auth.user.current_store)) || (stores.length > 0 ? stores[0] : null)}
                            />
                        </div>
                    ) : stores.length > 0 && (
                        <div className="ml-2 sm:ml-4 hidden sm:flex items-center">
                            <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-muted-foreground border rounded-md truncate max-w-[120px] sm:max-w-none">
                                {stores.find(store => String(store.id) === String(auth.user.current_store))?.name || stores[0]?.name || 'No Store'}
                            </div>
                        </div>
                    )}

                    {/* Desktop Navigation */}
                    <div className="ml-6 hidden h-full items-center space-x-6 lg:flex">
                        <NavigationMenu className="flex h-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch space-x-2">
                                {mainNavItems.map((item, index) => (
                                    <NavigationMenuItem key={index} className="relative flex h-full items-center">
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                navigationMenuTriggerStyle(),
                                                page.url === item.href && activeItemStyles,
                                                'h-9 cursor-pointer px-3',
                                            )}
                                        >
                                            {item.icon && <Icon iconNode={item.icon} className="mr-2 h-4 w-4" />}
                                            {item.title}
                                        </Link>
                                        {page.url === item.href && (
                                            <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                                        )}
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto flex items-center space-x-1 sm:space-x-2">
                        {/* Visit Store Dropdown */}
                        {stores.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="hidden sm:flex items-center gap-2 min-h-[44px] sm:min-h-0"
                                    >
                                        <Store className="h-4 w-4" />
                                        <span className="hidden md:inline">{t('Visit Store')}</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {stores.length === 1 ? (
                                        <DropdownMenuItem asChild>
                                            <Link 
                                                href={route('store.home', { storeSlug: stores[0].slug })}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                <span className="truncate">{stores[0].name}</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    ) : (
                                        stores.map((store: any) => (
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
                        <div className="relative flex items-center space-x-1">
                            <Button variant="ghost" size="icon" className="group min-h-[44px] min-w-[44px] h-[44px] w-[44px] sm:h-9 sm:w-9 cursor-pointer">
                                <Search className="!size-5 opacity-80 group-hover:opacity-100" />
                            </Button>
                            <div className="hidden lg:flex">
                                {rightNavItems.map((item) => (
                                    <TooltipProvider key={item.title} delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <a
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group text-accent-foreground ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md bg-transparent p-0 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    <span className="sr-only">{item.title}</span>
                                                    {item.icon && <Icon iconNode={item.icon} className="size-5 opacity-80 group-hover:opacity-100" />}
                                                </a>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{item.title}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="min-h-[44px] min-w-[44px] h-[44px] w-[44px] sm:size-10 rounded-full p-1">
                                    <Avatar className="size-8 sm:size-8 overflow-hidden rounded-full">
                                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </>
    );
}
