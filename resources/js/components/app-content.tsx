import { SidebarInset } from '@/components/ui/sidebar';
import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    if (variant === 'sidebar') {
        return <SidebarInset {...props}>{children}</SidebarInset>;
    }

    return (
        <main className='mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-3 sm:gap-4 md:gap-6 rounded-xl px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6' {...props}>
            {children}
        </main>
    );
}
