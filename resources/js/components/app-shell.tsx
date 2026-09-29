import { SidebarProvider } from '@/components/ui/sidebar';
import { useLayout } from '@/contexts/LayoutContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const APP_SHELL_SIDEBAR_OPEN_KEY = 'appShellSidebarOpen';
const LEGACY_APP_SHELL_SIDEBAR_OPEN_KEY = 'idebar';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window === 'undefined') {
            return true;
        }
        const stored =
            localStorage.getItem(APP_SHELL_SIDEBAR_OPEN_KEY) ?? localStorage.getItem(LEGACY_APP_SHELL_SIDEBAR_OPEN_KEY);
        return stored !== 'false';
    });

    // All hooks must be called before any conditional returns
    const { position } = useLayout();

    const handleSidebarChange = (open: boolean) => {
        setIsOpen(open);

        if (typeof window !== 'undefined') {
            localStorage.setItem(APP_SHELL_SIDEBAR_OPEN_KEY, String(open));
        }
    };

    if (variant === 'header') {
        return (
            <div className='flex min-h-screen w-full flex-col'>
                {children}
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen} open={isOpen} onOpenChange={handleSidebarChange}>
            <div data-testid='app-shell' className={cn('flex w-full', position === 'right' ? 'flex-row-reverse' : 'flex-row')}>
                {children}
            </div>
        </SidebarProvider>
    );
}
