import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
import { FloatingChatGpt } from '@/components/FloatingChatGpt';
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
}

export function PageTemplate({ 
  title,
  description, 
  url, 
  actions, 
  children, 
  noPadding = false,
  breadcrumbs
}: PageTemplateProps) {
  // Default breadcrumbs if none provided
  const pageBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [
    {
      title,
      href: url,
    },
  ];

  return (
    <AppLayout breadcrumbs={pageBreadcrumbs}>
      <Head title={title} />
      
      <div className={cn('flex h-full flex-1 flex-col gap-4', noPadding ? '' : 'p-2 sm:p-4 lg:p-6')}>
        {/* Header with action buttons */}
        {!noPadding && (
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground'>{title}</h1>
            {actions && actions.length > 0 && (
              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto'>
                {actions.map((action, index) => (
                  <Button 
                    key={index}
                    variant={action.variant || 'outline'} 
                    size='sm'
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={cn(
                      'w-full sm:w-auto min-h-[44px] sm:min-h-0 justify-center sm:justify-start',
                      action.className
                    )}
                  >
                    {action.icon}
                    <span className='ml-2'>{action.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={cn(noPadding ? 'h-full' : 'bg-transparent w-full overflow-x-hidden')}>
          {children}
        </div>
      </div>
      <FloatingChatGpt />
    </AppLayout>
  );
}
