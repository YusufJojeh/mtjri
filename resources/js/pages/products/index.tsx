import React, { useState, useMemo } from 'react';
import { PageTemplate } from '@/components/page-template';
import { Plus, RefreshCw, Download, Package, Eye, Edit, Trash2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import { getImageUrl } from '@/utils/image-helper';
import { useCurrencyFormatter } from '@/hooks/use-store-currency';
import { Permission } from '@/components/Permission';
import { usePermissions } from '@/hooks/usePermissions';

export default function Products() {
  const { t } = useTranslation();
  const { products: productsProp, stats } = usePage().props as any;
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const formatCurrency = useCurrencyFormatter();
  const { hasPermission } = usePermissions();
  
  // Ensure products is always an array (handle paginator objects)
  const products = useMemo(() => {
    if (!productsProp) return [];
    // If it's a paginator object, get the data array
    if (productsProp.data && Array.isArray(productsProp.data)) {
      return productsProp.data;
    }
    // If it's already an array, return it
    if (Array.isArray(productsProp)) {
      return productsProp;
    }
    // Fallback to empty array
    return [];
  }, [productsProp]);
  
  const handleDelete = () => {
    if (productToDelete) {
      router.delete(route('products.destroy', productToDelete));
      setProductToDelete(null);
    }
  };

  const pageActions = [];
  
  if (hasPermission('export-products')) {
    pageActions.push({
      label: t('Export'),
      icon: <Download className='h-4 w-4' />,
      variant: 'outline' as const,
      onClick: () => window.open(route('products.export'), '_blank')
    });
  }
  
  if (hasPermission('create-products')) {
    pageActions.push({
      label: t('Create Product'),
      icon: <Plus className='h-4 w-4' />,
      variant: 'default' as const,
      onClick: () => router.visit(route('products.create'))
    });
  }

  return (
    <PageTemplate 
      title={t('Products')}
      url='/products'
      actions={pageActions}
      breadcrumbs={[
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Products') }
      ]}
    >
      <div className='space-y-4'>
        {/* Stats Cards */}
        <div className='grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Total Products')}</CardTitle>
              <Package className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-xl sm:text-2xl font-bold'>{stats.total}</div>
              <p className='text-xs text-muted-foreground'>{t('All products')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Active Products')}</CardTitle>
              <Package className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-xl sm:text-2xl font-bold'>{stats.active}</div>
              <p className='text-xs text-muted-foreground'>
                {t('{{percent}}% active rate', { percent: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0 })}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Low Stock')}</CardTitle>
              <Package className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-xl sm:text-2xl font-bold'>{stats.lowStock}</div>
              <p className='text-xs text-muted-foreground'>{t('Need restocking')}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Total Value')}</CardTitle>
              <Package className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-lg sm:text-xl lg:text-2xl font-bold break-words'>{formatCurrency(stats.totalValue)}</div>
              <p className='text-xs text-muted-foreground'>{t('Inventory value')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        <Card>
          <CardHeader className='p-3 sm:p-6'>
            <CardTitle className='text-base sm:text-lg'>{t('Product Catalog')}</CardTitle>
          </CardHeader>
          <CardContent className='p-3 sm:p-6 pt-0'>
            <div className='space-y-3 sm:space-y-4'>
              {products.length === 0 ? (
                <div className='text-center py-8'>
                  <Package className='h-12 w-12 mx-auto text-muted-foreground opacity-50' />
                  <p className='mt-2 text-muted-foreground'>{t('No products found')}</p>
                  <Permission permission='create-products'>
                    <Button 
                      variant='outline' 
                      className='mt-4 min-h-[44px]' 
                      onClick={() => router.visit(route('products.create'))}
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      {t('Create your first product')}
                    </Button>
                  </Permission>
                </div>
              ) : (
                products.map((product: any) => (
                  <div key={product.id} className='flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4'>
                    <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full min-w-0'>
                      <div className='w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border shrink-0'>
                        {product.cover_image ? (
                          <img
                            src={getImageUrl(product.cover_image)}
                            alt={product.name}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <div className='w-full h-full bg-primary/10 flex items-center justify-center'>
                            <Package className='h-6 w-6 text-primary' />
                          </div>
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-1 sm:space-y-0'>
                          <h3 className='font-semibold text-sm sm:text-base truncate'>{product.name}</h3>
                          <div className='flex items-center space-x-2 flex-shrink-0'>
                            <Badge variant={product.is_active ? 'default' : 'secondary'} className='text-xs'>
                              {product.is_active ? t('Active') : t('Inactive')}
                            </Badge>
                            {product.stock <= 0 && (
                              <Badge variant='destructive'>{t('Out of Stock')}</Badge>
                            )}
                          </div>
                        </div>
                        <p className='text-sm text-muted-foreground mt-1 sm:mt-0'>{t('SKU: {{sku}}', { sku: product.sku || '-' })}</p>
                        <div className='flex flex-wrap items-center space-x-2 sm:space-x-4 mt-1'>
                          <span className='text-sm font-medium'>{formatCurrency(product.price)}</span>
                          <span className='text-xs text-muted-foreground'>{t('Stock: {{stock}}', { stock: product.stock })}</span>
                          <span className='text-xs text-muted-foreground'>{product.category?.name || '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2 mt-4 sm:mt-0 sm:ml-auto w-full sm:w-auto'>
                      <Permission permission='view-products'>
                        <Button 
                          variant='ghost' 
                          size='sm' 
                          onClick={() => router.visit(route('products.show', product.id))}
                          className='flex-1 sm:flex-none min-h-[44px] sm:min-h-0'
                        >
                          <Eye className='h-4 w-4 sm:mr-0' />
                          <span className='ml-2 sm:hidden'>{t('View')}</span>
                        </Button>
                      </Permission>
                      <Permission permission='edit-products'>
                        <Button 
                          variant='ghost' 
                          size='sm' 
                          onClick={() => router.visit(route('products.edit', product.id))}
                          className='flex-1 sm:flex-none min-h-[44px] sm:min-h-0'
                        >
                          <Edit className='h-4 w-4 sm:mr-0' />
                          <span className='ml-2 sm:hidden'>{t('Edit')}</span>
                        </Button>
                      </Permission>
                      <Permission permission='delete-products'>
                        <Button 
                          variant='ghost' 
                          size='sm' 
                          onClick={() => setProductToDelete(product.id)}
                          className='flex-1 sm:flex-none min-h-[44px] sm:min-h-0'
                        >
                          <Trash2 className='h-4 w-4 sm:mr-0' />
                          <span className='ml-2 sm:hidden'>{t('Delete')}</span>
                        </Button>
                      </Permission>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent data-testid='delete-product-dialog'>
          <DialogHeader>
            <DialogTitle>{t('Delete Product')}</DialogTitle>
            <DialogDescription>
              {t('Are you sure you want to delete this product? This action cannot be undone.')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setProductToDelete(null)}>
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
