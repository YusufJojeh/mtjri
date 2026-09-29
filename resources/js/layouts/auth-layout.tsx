import { Head, Link } from '@inertiajs/react';
import { accessibleBrand } from '@/lib/commerce/color';
import { ReactNode, useEffect, useState } from 'react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useBrand } from '@/contexts/BrandContext';
import { useAppearance, THEME_COLORS } from '@/hooks/use-appearance';
import { PUBLIC_BRAND_PRIMARY, getMarketingLogoDisplayUrl } from '@/lib/public-brand';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    icon?: ReactNode;
    status?: string;
    statusType?: 'success' | 'error';
}

export default function AuthLayout({
    children,
    title,
    description,
    icon,
    status,
    statusType = 'success',
}: AuthLayoutProps) {
    const [mounted, setMounted] = useState(false);
    const { logoLight, logoDark, themeColor, customColor } = useBrand();
    const { appearance } = useAppearance();

    const primaryColor =
        accessibleBrand(themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS] || PUBLIC_BRAND_PRIMARY);

    useEffect(() => {
        setMounted(true);
    }, []);

    const logoSrc = mounted
        ? getMarketingLogoDisplayUrl(
              logoLight,
              logoDark,
              appearance === 'dark' || document.documentElement.classList.contains('dark'),
          )
        : '';

    return (
        <div
            data-public-shell
            className='relative flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'
            data-testid='auth-shell'
            style={
                {
                    '--primary-color': primaryColor,
                } as React.CSSProperties
            }
        >
            <Head title={title} />
            <div className='pointer-events-none absolute inset-0 -z-10 overflow-hidden' aria-hidden>
                <div className='public-ambient-mesh absolute inset-0 opacity-90 dark:opacity-60' />
                <div
                    className='absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-25 blur-3xl dark:opacity-20'
                    style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 35%, transparent)` }}
                />
                <div className='absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-sky-400/15 blur-3xl dark:bg-sky-500/10' />
            </div>

            <div className='relative flex w-full flex-col items-center justify-center gap-6 p-4 sm:p-6 md:p-12'>
                {/* Brand + language: a normal row on phones, pinned to the corners from md up. */}
                <div className='flex w-full max-w-2xl items-center justify-between md:contents'>
                    <Link
                        href={route('home')}
                        aria-label='Tijraa'
                        className='public-focus-ring z-10 flex items-center gap-2 rounded-lg p-1 focus:outline-none md:absolute md:start-8 md:top-8'
                        style={{ ['--tw-ring-color' as string]: primaryColor }}
                    >
                        <img src={logoSrc || '/images/logos/logo-dark.png'} alt='' className='h-8 w-auto max-w-[160px] object-contain md:h-9' />
                    </Link>

                    <div className='z-10 md:absolute md:end-8 md:top-8'>
                        <LanguageSwitcher />
                    </div>
                </div>

                <div 
                    className={`w-full max-w-2xl transition-all duration-700 ${
                        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
                >
                    <div className='rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-xl sm:p-8 shadow-slate-900/10 backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/95 md:p-10'>
                        <div className='text-center mb-6'>
                            {icon && (
                                <div 
                                    className='mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full'
                                    style={{ backgroundColor: `${primaryColor}20` }}
                                >
                                    {icon}
                                </div>
                            )}
                            <h1 className='mb-2 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white'>{title}</h1>
                            {description && (
                                <p className='text-base text-slate-600 sm:text-lg dark:text-slate-400'>{description}</p>
                            )}
                        </div>
                        
                        {status && (
                            <div className={`mb-6 text-center text-sm font-medium ${
                                statusType === 'success' 
                                    ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30' 
                                    : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30'
                            } p-3 rounded-lg border`}>
                                {status}
                            </div>
                        )}
                        
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
