import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { Plus, RefreshCw, Download, Users, Eye, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { getImageUrl } from '@/utils/image-helper';
import { useCurrencyFormatter } from '@/hooks/use-store-currency';
import { Permission } from '@/components/Permission';
import { usePermissions } from '@/hooks/usePermissions';

export default function Customers() {
  const { t } = useTranslation();
  const { customers: customersProp, stats: statsProp } = usePage().props as any;
  const customers = Array.isArray(customersProp) ? customersProp : (customersProp?.data || []);
  const stats = statsProp || { total: 0, active: 0, new: 0, growth: 0 };
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const formatCurrency = useCurrencyFormatter();
  const { hasPermission } = usePermissions();

  const handleDelete = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    router.delete(route('customers.destroy', selectedCustomer.id), {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      }
    });
  };

  const pageActions = [];
  
  if (hasPermission('export-customers')) {
    pageActions.push({
      label: t('Export'),
      icon: <Download className='h-4 w-4' />,
      variant: 'outline' as const,
      onClick: () => window.open(route('customers.export'), '_blank')
    });
  }
  
  if (hasPermission('create-customers')) {
    pageActions.push({
      label: t('Add Customer'),
      icon: <Plus className='h-4 w-4' />,
      variant: 'default' as const,
      onClick: () => router.visit(route('customers.create'))
    });
  }

  return (
    <>
      <PageTemplate 
        title={t('Customer Management')}
        url='/customers'
        actions={pageActions}
        breadcrumbs={[
          { title: t('Dashboard'), href: route('dashboard') },
          { title: t('Customer Management') }
        ]}
      >
        <div className='space-y-4'>
          {/* Stats Cards */}
          <div className='grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
                <CardTitle className='text-xs sm:text-sm font-medium'>{t('Total Customers')}</CardTitle>
                <Users className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
              </CardHeader>
              <CardContent className='p-3 sm:p-6 pt-0'>
                <div className='text-xl sm:text-2xl font-bold'>{stats.totalCustomers}</div>
                <p className='text-xs text-muted-foreground'>{stats.newThisMonth > 0 ? t('+{{count}} from last month', { count: stats.newThisMonth }) : t('No new customers')}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
                <CardTitle className='text-xs sm:text-sm font-medium'>{t('Active Customers')}</CardTitle>
                <Users className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
              </CardHeader>
              <CardContent className='p-3 sm:p-6 pt-0'>
                <div className='text-xl sm:text-2xl font-bold'>{stats.activeCustomers}</div>
                <p className='text-xs text-muted-foreground'>
                  {t('{{percent}}% active rate', { percent: stats.totalCustomers > 0 ? Math.round((stats.activeCustomers / stats.totalCustomers) * 100) : 0 })}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
                <CardTitle className='text-xs sm:text-sm font-medium'>{t('New This Month')}</CardTitle>
                <Users className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
              </CardHeader>
              <CardContent className='p-3 sm:p-6 pt-0'>
                <div className='text-xl sm:text-2xl font-bold'>{stats.newThisMonth}</div>
                <p className='text-xs text-muted-foreground'>
                  {stats.totalCustomers > 0 ? t('{{percent}}% growth', { percent: Math.round((stats.newThisMonth / stats.totalCustomers) * 100) }) : t('No growth')}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
                <CardTitle className='text-xs sm:text-sm font-medium'>{t('Avg. Order Value')}</CardTitle>
                <Users className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
              </CardHeader>
              <CardContent className='p-3 sm:p-6 pt-0'>
                <div className='text-lg sm:text-xl lg:text-2xl font-bold break-words'>{formatCurrency(stats.avgOrderValue)}</div>
                <p className='text-xs text-muted-foreground'>{t('Per order')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Customers List */}
          <Card>
            <CardHeader className='p-3 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>{t('Customer Directory')}</CardTitle>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='space-y-3 sm:space-y-4'>
                {customers.length === 0 ? (
                  <div className='text-center py-12'>
                    <Users className='h-12 w-12 mx-auto text-muted-foreground opacity-50' />
                    <h3 className='mt-4 text-base sm:text-lg font-medium'>{t('No customers found')}</h3>
                    <p className='mt-2 text-xs sm:text-sm text-muted-foreground'>
                      {t('Get started by adding your first customer.')}
                    </p>
                    <Permission permission='create-customers'>
                      <Button 
                        onClick={() => router.visit(route('customers.create'))} 
                        className='mt-4 min-h-[44px]'
                      >
                        <Plus className='h-4 w-4 mr-2' />
                        {t('Add Customer')}
                      </Button>
                    </Permission>
                  </div>
                ) : (
                  <div className='space-y-3 sm:space-y-4'>
                    {customers.map((customer) => (
                      <div key={customer.id} className='flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4'>
                        <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full min-w-0'>
                          <Avatar className='h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0'>
                            <AvatarImage src={customer.avatar ? getImageUrl(customer.avatar) : ''} alt={customer.full_name} />
                            <AvatarFallback className='text-sm sm:text-base'>{customer.initials}</AvatarFallback>
                          </Avatar>
                          <div className='flex-1 min-w-0'>
                            <div className='flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0'>
                              <h3 className='font-semibold text-sm sm:text-base truncate'>{customer.full_name}</h3>
                              <Badge variant={customer.is_active ? 'default' : 'secondary'} className='text-xs flex-shrink-0'>
                                {customer.is_active ? t('Active') : t('Inactive')}
                              </Badge>
                            </div>
                            <div className='flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0 text-xs sm:text-sm text-muted-foreground mt-1'>
                              <div className='flex items-center space-x-1'>
                                <Mail className='h-3 w-3 flex-shrink-0' />
                                <span className='truncate'>{customer.email}</span>
                              </div>
                              {customer.phone && (
                                <div className='flex items-center space-x-1'>
                                  <Phone className='h-3 w-3 flex-shrink-0' />
                                  <span className='truncate'>{customer.phone}</span>
                                </div>
                              )}
                            </div>
                            <div className='flex flex-wrap items-center gap-2 sm:gap-4 mt-2'>
                              <span className='text-xs text-muted-foreground'>{t('{{count}} orders', { count: customer.total_orders })}</span>
                              <span className='text-xs text-muted-foreground'>{t('{{amount}} spent', { amount: formatCurrency(customer.total_spent || 0) })}</span>
                              <span className='text-xs text-muted-foreground'>{t('Joined {{date}}', { date: new Date(customer.created_at).toLocaleDateString() })}</span>
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2 w-full sm:w-auto'>
                          <Permission permission='view-customers'>
                            <Button 
                              variant='ghost' 
                              size='sm' 
                              onClick={() => router.visit(route('customers.show', customer.id))}
                              className='flex-1 sm:flex-none min-h-[44px] sm:min-h-0'
                            >
                              <Eye className='h-4 w-4 sm:mr-0' />
                              <span className='ml-2 sm:hidden'>{t('View')}</span>
                            </Button>
                          </Permission>
                          <Permission permission='edit-customers'>
                            <Button 
                              variant='ghost' 
                              size='sm' 
                              onClick={() => router.visit(route('customers.edit', customer.id))}
                              className='flex-1 sm:flex-none min-h-[44px] sm:min-h-0'
                            >
                              <Edit className='h-4 w-4 sm:mr-0' />
                              <span className='ml-2 sm:hidden'>{t('Edit')}</span>
                            </Button>
                          </Permission>
                          <Permission permission='delete-customers'>
                            <Button 
                              variant='ghost' 
                              size='sm' 
                              onClick={() => handleDelete(customer)}
                              className='flex-1 sm:flex-none min-h-[44px] sm:min-h-0'
                            >
                              <Trash2 className='h-4 w-4 sm:mr-0' />
                              <span className='ml-2 sm:hidden'>{t('Delete')}</span>
                            </Button>
                          </Permission>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageTemplate>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Delete Customer')}</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <p>{t("Are you sure you want to delete the customer '{{name}}'?", { name: selectedCustomer?.full_name })}</p>
            <p className='text-sm text-muted-foreground mt-2'>
              {t('This action cannot be undone.')}
            </p>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)}>{t('Cancel')}</Button>
            <Button variant='destructive' onClick={handleDeleteConfirm}>{t('Delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
