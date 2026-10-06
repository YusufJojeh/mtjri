import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { TableColumn, TableAction } from '@/types/crud';
import { useTranslation } from 'react-i18next';
import * as LucidIcons from 'lucide-react';
import { hasPermission } from '@/utils/authorization';

interface MobileTableCardProps {
  row: any;
  index: number;
  from: number;
  columns: TableColumn[];
  actions: TableAction[];
  onAction: (action: string, row: any) => void;
  statusColors?: Record<string, string>;
  permissions: string[];
  entityPermissions?: {
    view: string;
    edit: string;
    delete: string;
    create?: string;
  };
}

export function MobileTableCard({
  row,
  index,
  from,
  columns,
  actions,
  onAction,
  statusColors = {},
  permissions,
  entityPermissions
}: MobileTableCardProps) {
  const { t } = useTranslation();

  // Helper function to get nested property value using dot notation
  const getNestedValue = (obj: any, path: string) => {
    if (!obj || !path) return null;
    const keys = path.split('.');
    return keys.reduce((acc, key) => {
      return acc && acc[key] !== undefined ? acc[key] : null;
    }, obj);
  };

  // Get visible actions for this row
  const getVisibleActions = () => {
    return actions.filter((action) => {
      const permissionKey = action.requiredPermission || (
        entityPermissions && (
          action.action === 'view' 
            ? entityPermissions.view 
            : action.action === 'edit' 
              ? entityPermissions.edit 
              : action.action === 'delete' 
                ? entityPermissions.delete 
                : action.permission
        )
      );
      
      if (permissionKey && !hasPermission(permissions, permissionKey)) {
        return false;
      }
      
      if (action.condition && !action.condition(row)) {
        return false;
      }

      return true;
    });
  };

  const renderCellContent = (col: TableColumn) => {
    const value = getNestedValue(row, col.key);
    
    if (col.render) {
      return col.render(value, row);
    }
    
    switch (col.type) {
      case 'badge':
        return (
          <Badge className={cn('capitalize text-xs sm:text-sm', statusColors[value])}>
            {value}
          </Badge>
        );
        
      case 'image':
        if (!value) {
          return <div className='text-center text-gray-400 text-xs'>{t('No image')}</div>;
        }
        return (
          <div className='flex justify-start'>
            <img 
              src={value.startsWith && value.startsWith('http') 
                ? value 
                : `/storage/${value}`} 
              alt={row.name || 'Image'} 
              className={col.className || 'h-16 w-20 rounded-md object-cover shadow-sm'} 
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/200x150?text=Image+Not+Found';
              }}
            />
          </div>
        );
        
      case 'date':
        return value ? (
          <span className='text-sm text-muted-foreground'>
            {new Date(value).toLocaleDateString()}
          </span>
        ) : <span className='text-sm text-muted-foreground'>-</span>;
        
      case 'currency':
        return (
          <span className='text-sm font-medium'>
            {typeof value === 'number' 
              ? value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) 
              : value}
          </span>
        );
        
      case 'boolean':
        return (
          <span className='text-sm'>{value ? t('Yes') : t('No')}</span>
        );
        
      case 'link': {
        if (!value) return <span className='text-sm text-muted-foreground'>-</span>;
        
        const href = col.href 
          ? (typeof col.href === 'function' ? col.href(row) : col.href.replace(':id', row.id))
          : '#';
          
        return (
          <Link 
            href={href} 
            className={cn('text-sm font-medium hover:underline', col.linkClassName || 'text-primary')}
            target={col.openInNewTab ? '_blank' : undefined}
          >
            {value}
          </Link>
        );
      }
        
      default:
        return (
          <span className='text-sm font-medium text-foreground break-words'>
            {value || '-'}
          </span>
        );
    }
  };

  // Find the primary column (usually name or title)
  const primaryColumn = columns.find(col => 
    col.key === 'name' || 
    col.key === 'title' || 
    col.key === 'order_number' ||
    col.key === 'email' ||
    col.key === 'customer'
  ) || columns[0];

  const primaryValue = getNestedValue(row, primaryColumn?.key || '');

  // Get other columns (excluding primary)
  const otherColumns = columns.filter(col => col.key !== primaryColumn?.key);

  const visibleActions = getVisibleActions();

  return (
    <Card className='w-full'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-base sm:text-lg font-semibold truncate'>
              {primaryValue || `#${from + index}`}
            </CardTitle>
            {primaryColumn && primaryColumn.label && (
              <p className='text-xs text-muted-foreground mt-1'>
                {primaryColumn.label}
              </p>
            )}
          </div>
          <div className='flex-shrink-0 text-xs text-muted-foreground'>
            #{from + index}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className='space-y-3 pt-0'>
        {otherColumns.slice(0, 4).map((col) => (
          <div key={col.key} className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2'>
            <div className='text-xs font-medium text-muted-foreground sm:w-1/3'>
              {col.label}:
            </div>
            <div className='flex-1 sm:w-2/3'>
              {renderCellContent(col)}
            </div>
          </div>
        ))}
        
        {otherColumns.length > 4 && (
          <div className='text-xs text-muted-foreground pt-2 border-t'>
            {t('{{count}} more fields', { count: otherColumns.length - 4 })}
          </div>
        )}
      </CardContent>
      
      {visibleActions.length > 0 && (
        <CardFooter className='pt-3 flex flex-wrap gap-2'>
          {visibleActions.map((action, idx) => {
            const IconComponent = (LucidIcons as any)[action.icon] as React.ElementType;
            const iconSize = 18;

            if (action.href) {
              const href = typeof action.href === 'function' 
                ? action.href(row) 
                : action.href.replace(':id', row.id);
              
              return (
                <Link 
                  key={idx}
                  href={href} 
                  target={action.openInNewTab ? '_blank' : undefined}
                  className='flex-1 sm:flex-none'
                >
                  <Button 
                    variant='outline' 
                    size='sm'
                    className='w-full sm:w-auto min-h-[44px] sm:min-h-0'
                  >
                    {IconComponent && <IconComponent size={iconSize} />}
                    <span className='ms-2'>{action.label}</span>
                  </Button>
                </Link>
              );
            }

            if (!action.action) {
              return null;
            }
            
            // Determine button variant based on action type
            const getButtonVariant = () => {
              if (action.action === 'delete') return 'destructive';
              if (action.action === 'edit') return 'default';
              return 'outline';
            };
            
            return (
              <Button
                key={idx}
                variant={getButtonVariant()}
                size='sm'
                className={cn(
                  'flex-1 sm:flex-none min-h-[44px] sm:min-h-0',
                  action.className
                )}
                onClick={() => onAction(action.action!, row)}
              >
                {IconComponent && <IconComponent size={iconSize} />}
                <span className='ms-2'>{action.label}</span>
              </Button>
            );
          })}
        </CardFooter>
      )}
    </Card>
  );
}

