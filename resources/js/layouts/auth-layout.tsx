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
    /** `wide` for multi-column flows such as the register stepper. */
    size?: 'default' | 'wide';
}

export default function AuthLayout({
    children,
    title,
    description,
    icon,
    status,
    statusType = 'success',
    size = 'default',
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
            className='relative isolate flex min-h-screen w-full items-center justify-center bg-background'
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

            <div className='relative flex min-h-screen w-full flex-col items-center justify-center gap-6 p-4 sm:p-6 md:p-12'>
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

                {/* CSS-driven entrance so the form is visible before hydration. */}
                <div className={`w-full ${size === 'wide' ? 'max-w-4xl' : 'max-w-md'} animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out`}>
                    <div className='rounded-2xl border bg-card/95 p-6 text-card-foreground shadow-pop backdrop-blur-md sm:p-8'>
                        <div className='mb-6 text-center'>
                            {icon && (
                                <div 
                                    className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full'
                                    style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 12%, transparent)` }}
                                >
                                    {icon}
                                </div>
                            )}
                            <h1 className='mb-1.5 text-2xl font-semibold tracking-tight text-foreground'>{title}</h1>
                            {description && (
                                <p className='text-sm text-muted-foreground sm:text-base'>{description}</p>
                            )}
                        </div>
                        
                        {status && (
                            <div
                                role={statusType === 'error' ? 'alert' : 'status'}
                                className={`mb-6 rounded-lg border p-3 text-center text-sm font-medium ${
                                    statusType === 'success'
                                        ? 'border-success/30 bg-success-soft text-success-fg'
                                        : 'border-danger/30 bg-danger-soft text-danger-fg'
                                }`}
                            >
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
