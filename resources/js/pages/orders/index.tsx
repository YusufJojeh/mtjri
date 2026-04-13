import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { Plus, RefreshCw, Download, ShoppingCart, Eye, Edit, Trash2, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { useCurrencyFormatter } from '@/hooks/use-store-currency';
import { Permission } from '@/components/Permission';
import { usePermissions } from '@/hooks/usePermissions';

interface OrdersProps {
  orders: Array<{
    id: number;
    orderNumber: string;
    customer: string;
    email: string;
    total: number;
    status: string;
    items: number;
    date: string;
    paymentMethod: string;
  }>;
  stats: {
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
}

export default function Orders({ orders: ordersProp = [], stats: statsProp }: OrdersProps) {
  const { t } = useTranslation();
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);
  const formatCurrency = useCurrencyFormatter();
  const { hasPermission } = usePermissions();

  // Handle paginated orders - Laravel pagination returns an object with 'data' property
  const orders = (() => {
    if (!ordersProp) return [];
    if (Array.isArray(ordersProp)) return ordersProp;
    if (ordersProp && typeof ordersProp === 'object' && 'data' in ordersProp) {
      return Array.isArray(ordersProp.data) ? ordersProp.data : [];
    }
    return [];
  })();

  // Ensure stats is always an object with safe defaults
  const stats = statsProp && typeof statsProp === 'object' ? statsProp : {
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0
  };
  
  const handleDelete = () => {
    if (orderToDelete) {
      router.delete(route('orders.destroy', orderToDelete));
      setOrderToDelete(null);
    }
  };

  const pageActions = [];
  
  if (hasPermission('export-orders')) {
    pageActions.push({
      label: t('Export'),
      icon: <Download className='h-4 w-4' />,
      variant: 'outline' as const,
      onClick: () => window.open(route('orders.export'), '_blank')
    });
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Processing': return 'secondary';
      case 'Shipped': return 'outline';
      case 'Cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <PageTemplate 
      title={t('Order Management')}
      url='/orders'
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Order Management') }
      ]}
    >
      <div className='space-y-4'>
        {/* Stats Cards */}
        <div className='grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Total Orders')}</CardTitle>
              <ShoppingCart className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-xl sm:text-2xl font-bold'>{stats?.totalOrders || 0}</div>
              <p className='text-xs text-muted-foreground'>{t('Total orders in store')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Pending Orders')}</CardTitle>
              <Package className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-xl sm:text-2xl font-bold'>{stats?.pendingOrders || 0}</div>
              <p className='text-xs text-muted-foreground'>{t('Need attention')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Total Revenue')}</CardTitle>
              <ShoppingCart className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-lg sm:text-xl lg:text-2xl font-bold break-words'>{formatCurrency(stats?.totalRevenue || 0)}</div>
              <p className='text-xs text-muted-foreground'>{t('Total revenue')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Avg. Order Value')}</CardTitle>
              <ShoppingCart className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-lg sm:text-xl lg:text-2xl font-bold break-words'>{formatCurrency(stats?.avgOrderValue || 0)}</div>
              <p className='text-xs text-muted-foreground'>{t('Average order value')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader className='p-3 sm:p-6'>
            <CardTitle className='text-base sm:text-lg'>{t('Recent Orders')}</CardTitle>
          </CardHeader>
          <CardContent className='p-3 sm:p-6 pt-0'>
            <div className='space-y-3 sm:space-y-4'>
              {orders.length > 0 ? orders.map((order) => (
                <div key={order.id} className='flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4'>
                  <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full min-w-0'>
                    <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0'>
                      <ShoppingCart className='h-6 w-6 text-primary' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0'>
                        <h3 className='font-semibold text-sm sm:text-base truncate'>{order.orderNumber}</h3>
                        <Badge variant={getStatusVariant(order.status)} className='text-xs flex-shrink-0'>
                          {order.status}
                        </Badge>
                      </div>
                      <p className='text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-0 truncate'>{order.customer} • {order.email}</p>
                      <div className='flex flex-wrap items-center gap-2 sm:gap-4 mt-1'>
                        <span className='text-xs text-muted-foreground'>{formatCurrency(order.total)}</span>
                        <span className='text-xs text-muted-foreground'>{t('{{items}} items', { items: order.items })}</span>
                        <span className='text-xs text-muted-foreground'>{order.date}</span>
                        <span className='text-xs text-muted-foreground'>{order.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 mt-4 sm:mt-0 sm:ml-auto w-full sm:w-auto'>
                    <Permission permission='view-orders'>
                      <Button 
                        variant='ghost' 
                        size='sm' 
                        onClick={() => router.visit(route('orders.show', order.id))}
                        className='flex-1 sm:flex-none min-h-[44px] sm:min-h-0'
                      >
                        <Eye className='h-4 w-4 sm:mr-0' />
                        <span className='ml-2 sm:hidden'>{t('View')}</span>
                      </Button>
                    </Permission>
                    <Permission permission='edit-orders'>
                      <Button 
                        variant='ghost' 
                        size='sm' 
                        onClick={() => router.visit(route('orders.edit', order.id))}
                        className='flex-1 sm:flex-none min-h-[44px] sm:min-h-0'
                      >
                        <Edit className='h-4 w-4 sm:mr-0' />
                        <span className='ml-2 sm:hidden'>{t('Edit')}</span>
                      </Button>
                    </Permission>
                    <Permission permission='delete-orders'>
                      <Button 
                        variant='ghost' 
                        size='sm' 
                        onClick={() => setOrderToDelete(order.id)}
                        className='flex-1 sm:flex-none min-h-[44px] sm:min-h-0'
                      >
                        <Trash2 className='h-4 w-4 sm:mr-0' />
                        <span className='ml-2 sm:hidden'>{t('Delete')}</span>
                      </Button>
                    </Permission>
                  </div>
                </div>
              )) : (
                <div className='text-center py-8'>
                  <p className='text-muted-foreground'>{t('No orders found')}</p>
                  <div className='mt-4 flex items-center justify-center gap-2'>
                    <Permission permission='create-products'>
                      <Button onClick={() => router.visit(route('products.create'))}>
                        <Plus className='h-4 w-4 mr-2' />
                        {t('Create Product')}
                      </Button>
                    </Permission>
                    <Permission permission='view-products'>
                      <Button variant='outline' onClick={() => router.visit(route('products.index'))}>
                        {t('View Products')}
                      </Button>
                    </Permission>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      {orderToDelete && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-semibold mb-2'>{t('Delete Order')}</h3>
            <p className='text-sm text-gray-600 mb-4'>
              {t('Are you sure you want to delete this order? This action cannot be undone.')}
            </p>
            <div className='flex justify-end space-x-2'>
              <Button variant='outline' onClick={() => setOrderToDelete(null)}>
                {t('Cancel')}
              </Button>
              <Button variant='destructive' onClick={handleDelete}>
                {t('Delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}
