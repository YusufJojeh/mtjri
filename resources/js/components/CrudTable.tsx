// components/CrudTable.tsx
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import * as LucidIcons from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { TableColumn, TableAction } from '@/types/crud';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileTableCard } from '@/components/MobileTableCard';

interface CrudTableProps {
  columns: TableColumn[];
  actions: TableAction[];
  data: any[];
  from: number;
  onAction: (action: string, row: any) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  statusColors?: Record<string, string>;
  permissions: string[];
  entityPermissions?: {
    view: string;
    edit: string;
    delete: string;
    create?: string;
  };
  showActionsAsIcons?: boolean;
}

export function CrudTable({
  columns,
  actions,
  data,
  from,
  onAction,
  sortField,
  sortDirection,
  onSort,
  statusColors = {},
  permissions,
  entityPermissions
}: CrudTableProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const renderSortIcon = (column: TableColumn) => {
    if (!column.sortable) return null;
    
    if (sortField === column.key) {
      return sortDirection === 'asc' ? 
        <ChevronUp className='h-3.5 w-3.5 text-foreground' /> : 
        <ChevronDown className='h-3.5 w-3.5 text-foreground' />;
    }
    
    return <ChevronsUpDown className='h-3.5 w-3.5 opacity-40 transition-opacity group-hover/sort:opacity-80' />;
  };

  const handleSort = (column: TableColumn) => {
    if (!column.sortable || !onSort) return;
    onSort(column.key);
  };

  const getVisibleActionsForRow = (row: any) => {
    return actions.filter((action) => {
      // Skip if user doesn't have permission
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
      
      // Skip if condition function returns false
      if (action.condition && !action.condition(row)) {
        return false;
      }

      return true;
    });
  };

  const hasAnyVisibleActions = data.some(row => getVisibleActionsForRow(row).length > 0);

  const renderActionButtons = (row: any) => {
    const visibleActions = getVisibleActionsForRow(row);
    
    return (
      <div className='flex items-center justify-end gap-1'>
        {visibleActions.map((action, index) => {
          const IconComponent = (LucidIcons as any)[action.icon] as React.ElementType;

          // Handle link actions
          if (action.href) {
            const href = typeof action.href === 'function' 
              ? action.href(row) 
              : action.href.replace(':id', row.id);
              
            return (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant='ghost'
                      size='icon'
                      className={cn('h-8 w-8 text-muted-foreground hover:text-foreground', action.className)}
                    >
                      <Link href={href} target={action.openInNewTab ? '_blank' : undefined} aria-label={action.label}>
                        <IconComponent size={16} />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          // Handle regular action buttons
          if (!action.action) {
            return null;
          }
          
          return (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant='ghost' 
                    size='icon' 
                    className={cn('h-8 w-8 text-muted-foreground hover:text-foreground', action.className)} 
                    onClick={() => onAction(action.action!, row)}
                    aria-label={action.label}
                  >
                    <IconComponent size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{action.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  };

  // Helper function to get nested property value using dot notation
  const getNestedValue = (obj: any, path: string) => {
    if (!obj || !path) return null;
    
    const keys = path.split('.');
    return keys.reduce((acc, key) => {
      return acc && acc[key] !== undefined ? acc[key] : null;
    }, obj);
  };

  const renderCellContent = (row: any, col: TableColumn) => {
    // Get value using dot notation for nested properties
    const value = getNestedValue(row, col.key);
    
    // If column has custom render function, use it
    if (col.render) {
      return col.render(value, row);
    }
    
    // Handle different column types
    switch (col.type) {
      case 'badge':
        return (
          <Badge className={cn('capitalize', statusColors[value])}>
            {value}
          </Badge>
        );
        
      case 'image':
        if (!value) {
          return <div className='text-center text-xs text-muted-foreground'>{t('No image')}</div>;
        }
        return (
          <div className='flex justify-center'>
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
        return value ? <span className='text-sm'>{new Date(value).toLocaleDateString()}</span> : <span>-</span>;
        
      case 'currency':
        return <span className='text-sm'>{typeof value === 'number' ? 
          value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : 
          value}</span>;
          
      case 'boolean':
        return <span className='text-sm'>{value ? 'Yes' : 'No'}</span>;
        
      case 'link': {
        if (!value) return <span>-</span>;
        
        const href = col.href 
          ? (typeof col.href === 'function' ? col.href(row) : col.href.replace(':id', row.id))
          : '#';
          
        return (
          <Link 
            href={href} 
            className={col.linkClassName || 'font-medium text-primary underline-offset-4 hover:underline'}
            target={col.openInNewTab ? '_blank' : undefined}
          >
            {value}
          </Link>
        );
      }
        
      default:
        return <span className='text-sm font-medium'>{value || '-'}</span>;
    }
  };

  // Mobile card view
  if (isMobile) {
    return (
      <div className='space-y-4'>
        {data.length > 0 ? (
          data.map((row, index) => (
            <MobileTableCard
              key={row.id || index}
              row={row}
              index={index}
              from={from}
              columns={columns}
              actions={actions}
              onAction={onAction}
              statusColors={statusColors}
              permissions={permissions}
              entityPermissions={entityPermissions}
            />
          ))
        ) : (
          <div className='h-24 flex items-center justify-center text-center text-muted-foreground border rounded-lg'>
            <p>{t('No results found.')}</p>
          </div>
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50 hover:bg-muted/50'>
              <TableHead className='w-12'>#</TableHead>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={column.className}
                  aria-sort={
                    column.sortable && sortField === column.key
                      ? sortDirection === 'asc' ? 'ascending' : 'descending'
                      : undefined
                  }
                >
                  {column.sortable && onSort ? (
                    <button
                      type='button'
                      onClick={() => handleSort(column)}
                      className='group/sort -mx-1 inline-flex items-center gap-1 whitespace-nowrap rounded px-1 py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'
                    >
                      {column.label}
                      {renderSortIcon(column)}
                    </button>
                  ) : (
                    <div className='flex items-center whitespace-nowrap'>{column.label}</div>
                  )}
                </TableHead>
              ))}
              {hasAnyVisibleActions && (
                <TableHead className='w-24 text-end'>{t('Actions')}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <TableRow key={row.id || index}>
                  <TableCell className='text-muted-foreground'>{from + index}</TableCell>
                  {columns.map((col) => (
                    <TableCell 
                      key={col.key}
                      className={col.className}
                    >
                      {renderCellContent(row, col)}
                    </TableCell>
                  ))}
                  {hasAnyVisibleActions && (
                    <TableCell className='py-2 text-end'>
                      {renderActionButtons(row)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (hasAnyVisibleActions ? 2 : 1)} 
                  className='h-24 text-center text-muted-foreground'
                >
                  {t('No results found.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}