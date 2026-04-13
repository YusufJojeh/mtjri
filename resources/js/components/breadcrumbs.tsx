import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link } from '@inertiajs/react';
import { Fragment } from 'react';

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
    // Ensure items is always an array - handle null, undefined, and non-array values
    const safeItems = (() => {
        if (items === null || items === undefined) return [];
        if (Array.isArray(items)) return items.filter(item => item && typeof item === 'object');
        return [];
    })();
    
    return (
        <>
            {safeItems.length > 0 && (
                <Breadcrumb>
                    <BreadcrumbList>
                        {safeItems.map((item, index) => {
                            const isLast = index === safeItems.length - 1;
                            return (
                                <Fragment key={index}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link href={item.href || '#'}>{item.label}</Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && <BreadcrumbSeparator />}
                                </Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            )}
        </>
    );
}
