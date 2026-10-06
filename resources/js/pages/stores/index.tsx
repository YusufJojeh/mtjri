import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { Plus, RefreshCw, Download, Building2, Globe, Users, BarChart, Settings, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { useCurrencyFormatter } from '@/hooks/use-store-currency';
import { Permission } from '@/components/Permission';
import { usePermissions } from '@/hooks/usePermissions';

interface PageAction {
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: () => void;
}

interface Store {
  id: number;
  name: string;
  is_active: boolean;
  custom_domain?: string;
  custom_subdomain?: string;
  theme: string;
  created_at: string;
  total_orders?: number;
  formatted_revenue?: string;
}

interface AggregatedStats {
  totalCustomers?: number;
  formattedRevenue?: string;
}

interface StoreManagementProps {
  stores?: Store[] | { data: Store[] };
  aggregatedStats?: AggregatedStats;
}

export default function StoreManagement({ stores: storesProp = [], aggregatedStats: aggregatedStatsProp = {} }: StoreManagementProps) {
  const { t } = useTranslation();
  const [storeToDelete, setStoreToDelete] = useState<number | null>(null);
  const formatCurrency = useCurrencyFormatter();
  const { hasPermission } = usePermissions();

  // Handle paginated stores - Laravel pagination returns an object with 'data' property
  const stores: Store[] = (() => {
    if (!storesProp) return [];
    if (Array.isArray(storesProp)) return storesProp;
    if (storesProp && typeof storesProp === 'object' && 'data' in storesProp) {
      return Array.isArray((storesProp as { data: Store[] }).data) ? (storesProp as { data: Store[] }).data : [];
    }
    return [];
  })();

  // Ensure aggregatedStats is always an object with safe defaults
  const aggregatedStats = aggregatedStatsProp && typeof aggregatedStatsProp === 'object' ? aggregatedStatsProp : {
    totalCustomers: 0,
    formattedRevenue: '0.00'
  };
  
  const handleDelete = () => {
    if (storeToDelete) {
      router.delete(route('stores.destroy', storeToDelete));
      setStoreToDelete(null);
    }
  };

  const pageActions: PageAction[] = [];
  
  if (hasPermission('export-stores')) {
    pageActions.push({
      label: t('Export'),
      icon: <Download className='h-4 w-4' />,
      variant: 'outline',
      onClick: () => window.open(route('stores.export'), '_blank')
    });
  }
  
  if (hasPermission('create-stores')) {
    pageActions.push({
      label: t('Create Store'),
      icon: <Plus className='h-4 w-4' />,
      variant: 'default',
      onClick: () => router.visit(route('stores.create'))
    });
  }

  return (
    <PageTemplate 
      title={t('Store Management')}
      description={t('Manage and monitor all your stores')}
      url='/stores'
      actions={pageActions}
      breadcrumbs={[
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Store Management' }
      ]}
    >
      <div className='space-y-4'>
        {/* Stats Cards */}
        <div className='grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Total Stores')}</CardTitle>
              <Building2 className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-xl sm:text-2xl font-bold'>{stores.length}</div>
              <p className='text-xs text-muted-foreground'>{t('Your store count')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Active Stores')}</CardTitle>
              <Globe className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-xl sm:text-2xl font-bold'>{stores.filter((store: Store) => store.is_active).length}</div>
              <p className='text-xs text-muted-foreground'>
                {stores.length > 0 ? 
                  t('{{percent}}% active rate', { percent: Math.round((stores.filter((store: Store) => store.is_active).length / stores.length) * 100) }) : 
                  t('No stores yet')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Total Customers')}</CardTitle>
              <Users className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-xl sm:text-2xl font-bold'>{aggregatedStats.totalCustomers || 0}</div>
              <p className='text-xs text-muted-foreground'>{t('Across all stores')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Revenue')}</CardTitle>
              <BarChart className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-lg sm:text-xl lg:text-2xl font-bold break-words'>{aggregatedStats.formattedRevenue || formatCurrency(0)}</div>
              <p className='text-xs text-muted-foreground'>{t('Total revenue')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Stores List */}
        <Card>
          <CardHeader className='p-3 sm:p-6'>
            <CardTitle className='text-base sm:text-lg'>{t('Your Stores')}</CardTitle>
          </CardHeader>
          <CardContent>
            {stores.length === 0 ? (
              <div className='text-center py-8'>
                <Building2 className='h-12 w-12 mx-auto text-muted-foreground mb-4' />
                <h3 className='text-lg font-medium mb-2'>{t('No stores yet')}</h3>
                <p className='text-muted-foreground mb-4'>{t('Create your first store to get started')}</p>
                <Permission permission='create-stores'>
                  <Button onClick={() => router.visit(route('stores.create'))}>
                    <Plus className='h-4 w-4 me-2' /> {t('Create Store')}
                  </Button>
                </Permission>
              </div>
            ) : (
              <div className='space-y-4'>
              {stores.map((store: Store) => (
                <div key={store.id} className='flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-4'>
                  <div className='flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 flex-1 min-w-0'>
                    <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0'>
                      <Building2 className='h-6 w-6 text-primary' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
                        <h3 className='font-semibold truncate'>{store.name}</h3>
                        <Badge variant={store.is_active ? 'default' : 'secondary'} className='w-fit'>
                          {store.is_active ? t('Active') : t('Inactive')}
                        </Badge>
                      </div>
                      <p className='text-sm text-muted-foreground truncate'>
                        {store.custom_domain || store.custom_subdomain || t('No domain set')}
                      </p>
                      <div className='flex flex-wrap items-center gap-2 sm:gap-4 mt-1'>
                        <span className='text-xs text-muted-foreground'>{t('Theme: {{theme}}', { theme: store.theme })}</span>
                        <span className='text-xs text-muted-foreground hidden sm:inline'>{t('Created: {{date}}', { date: new Date(store.created_at).toLocaleDateString() })}</span>
                        <span className='text-xs text-muted-foreground'>{t('{{orders}} orders', { orders: store.total_orders || 0 })}</span>
                        <span className='text-xs text-muted-foreground hidden md:inline'>{t('{{revenue}} revenue', { revenue: store.formatted_revenue || formatCurrency(0) })}</span>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center justify-end sm:justify-start space-x-2 shrink-0'>
                    <Permission permission='view-stores'>
                      <Button variant='ghost' size='sm' onClick={() => router.visit(route('stores.show', store.id))} className='h-8 w-8 p-0'>
                        <Eye className='h-4 w-4' />
                      </Button>
                    </Permission>
                    <Permission permission='edit-stores'>
                      <Button variant='ghost' size='sm' onClick={() => router.visit(route('stores.edit', store.id))} className='h-8 w-8 p-0'>
                        <Edit className='h-4 w-4' />
                      </Button>
                    </Permission>
                    <Permission permission='manage-store-settings'>
                      <Button variant='ghost' size='sm' onClick={() => router.visit(route('stores.settings', store.id))} className='h-8 w-8 p-0'>
                        <Settings className='h-4 w-4' />
                      </Button>
                    </Permission>
                    <Permission permission='delete-stores'>
                      <Button variant='ghost' size='sm' onClick={() => setStoreToDelete(store.id)} className='h-8 w-8 p-0'>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </Permission>
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!storeToDelete} onOpenChange={(open) => !open && setStoreToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Delete Store')}</DialogTitle>
            <DialogDescription>
              {t('Are you sure you want to delete this store? This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setStoreToDelete(null)}>
              {t('Cancel')}
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              {t('Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
