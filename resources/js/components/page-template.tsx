import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageAction {
    label: string;
    icon?: ReactNode;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    onClick?: (e?: React.MouseEvent | React.FormEvent) => void;
    className?: string;
    disabled?: boolean;
}

export interface PageTemplateProps {
    title: string;
    description?: string;
    url: string;
    actions?: PageAction[];
    children: ReactNode;
    noPadding?: boolean;
    breadcrumbs?: BreadcrumbItem[];
    /** Render a custom header instead of the default title row. */
    header?: ReactNode;
    /** Constrain very wide pages; detail pages look better narrower. */
    width?: 'default' | 'narrow' | 'full';
}

/**
 * Shared page frame for every merchant screen: consistent gutters, max
 * width and a compact title row. Legacy pages get the new look for free.
 */
export function PageTemplate({ title, description, url, actions, children, noPadding = false, breadcrumbs, header, width = 'default' }: PageTemplateProps) {
    const pageBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [{ title, href: url }];

    return (
        <AppLayout breadcrumbs={pageBreadcrumbs}>
            <Head title={title} />

            <div
                className={cn(
                    'mx-auto flex w-full min-w-0 flex-1 flex-col gap-5',
                    noPadding ? '' : 'px-4 py-5 sm:px-6 lg:px-8 lg:py-6',
                    width === 'narrow' ? 'max-w-5xl' : width === 'full' ? '' : 'max-w-[1400px]',
                )}
            >
                {!noPadding &&
                    (header ?? (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0 space-y-1">
                                <h1 className="text-foreground truncate text-xl font-semibold tracking-tight sm:text-[1.375rem]">{title}</h1>
                                {description && <p className="text-muted-foreground text-sm">{description}</p>}
                            </div>
                            {actions && actions.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {actions.map((action, index) => (
                                        <Button
                                            key={index}
                                            variant={action.variant || 'outline'}
                                            size="sm"
                                            onClick={action.onClick}
                                            disabled={action.disabled}
                                            className={cn('h-9 sm:h-8', action.className)}
                                        >
                                            {action.icon}
                                            <span>{action.label}</span>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                <div className={cn('min-w-0', noPadding ? 'h-full' : 'w-full')}>{children}</div>
            </div>
        </AppLayout>
    );
}
