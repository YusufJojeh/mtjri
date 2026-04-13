import React from 'react';
import { PageTemplate } from '@/components/page-template';
import { RefreshCw, Download, BarChart, TrendingUp, Users, ShoppingCart, DollarSign, Eye, Package, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
import { useCurrencyFormatter } from '@/hooks/use-store-currency';
import { Permission } from '@/components/Permission';
import { usePermissions } from '@/hooks/usePermissions';
import { Link } from '@inertiajs/react';

interface Props {
  analytics: {
    metrics: any;
    topProducts: any[];
    topCustomers: any[];
    recentActivity: any[];
    revenueChart: any[];
    salesChart: any[];
  };
  hasStore: boolean;
}

export default function Analytics({ analytics, hasStore }: Props) {
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormatter();
  const { hasPermission } = usePermissions();

  const pageActions = hasPermission('export-analytics') ? [
    {
      label: t('Export Report'),
      icon: <Download className='h-4 w-4' />,
      variant: 'default' as const,
      onClick: () => {
        if (!hasStore) {
          alert(t('Please select a store before exporting analytics'));
          return;
        }
        window.open(route('analytics.export'), '_blank');
      }
    }
  ] : [];

  return (
    <PageTemplate 
      title={t('Analytics & Reporting')}
      url='/analytics'
      actions={pageActions}
      breadcrumbs={[
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Analytics & Reporting' }
      ]}
    >
      {/* No Store Alert */}
      {!hasStore && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">{t('No Store Selected')}</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {t('Please select a store from the header to view analytics data.')}
              </p>
              <Link
                href={route('stores.index')}
                className="text-sm text-yellow-900 underline font-medium mt-2 inline-block hover:text-yellow-700"
              >
                {t('Go to Stores')} →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className='space-y-4 sm:space-y-6'>
        {/* Key Metrics */}
        <div className='grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Total Revenue')}</CardTitle>
              <DollarSign className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-xl sm:text-2xl font-bold break-words'>{formatCurrency(analytics.metrics.revenue.current)}</div>
              <p className='text-xs text-muted-foreground'>
                {analytics.metrics.revenue.change >= 0 ? '+' : ''}{analytics.metrics.revenue.change.toFixed(1)}% {t('from last month')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Total Orders')}</CardTitle>
              <ShoppingCart className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-xl sm:text-2xl font-bold'>{analytics.metrics.orders.current.toLocaleString()}</div>
              <p className='text-xs text-muted-foreground'>
                {analytics.metrics.orders.change >= 0 ? '+' : ''}{analytics.metrics.orders.change} {t('from last month')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6'>
              <CardTitle className='text-xs sm:text-sm font-medium'>{t('Total Customers')}</CardTitle>
              <Users className='h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0' />
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='text-xl sm:text-2xl font-bold'>{analytics.metrics.customers.total.toLocaleString()}</div>
              <p className='text-xs text-muted-foreground'>
                +{analytics.metrics.customers.new} {t('new this month')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className='grid gap-2 sm:gap-6 grid-cols-2'>
          <Card>
            <CardHeader className='p-3 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>{t('Revenue Overview')}</CardTitle>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='h-64 sm:h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <RechartsBarChart data={analytics.revenueChart}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='date' tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${formatCurrency(value)}`, t('Revenue')]} />
                    <Bar dataKey='revenue' fill='#3b82f6' />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='p-3 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>{t('Sales Trend')}</CardTitle>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              <div className='h-64 sm:h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={analytics.salesChart}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='date' tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value) => [`${value}`, t('Orders')]} />
                    <Line type='monotone' dataKey='orders' stroke='#10b981' strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Customers */}
        <div className='grid gap-2 sm:gap-6 grid-cols-2'>
          <Card>
            <CardHeader className='p-3 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>{t('Top Selling Products')}</CardTitle>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              {analytics.topProducts.length > 0 ? (
                <div className='space-y-3 sm:space-y-4'>
                  {analytics.topProducts.map((product, index) => (
                    <div key={index} className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-sm sm:text-base truncate'>{product.name}</p>
                        <p className='text-xs sm:text-sm text-muted-foreground'>{product.sales} {t('units sold')}</p>
                      </div>
                      <div className='text-left sm:text-right flex-shrink-0'>
                        <p className='font-semibold text-green-600 text-sm sm:text-base'>{product.revenue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{t('No products data')}</p>
                  <p className="text-sm">{t('Start selling products to see top performers')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='p-3 sm:p-6'>
              <CardTitle className='text-base sm:text-lg'>{t('Top Customers')}</CardTitle>
            </CardHeader>
            <CardContent className='p-3 sm:p-6 pt-0'>
              {analytics.topCustomers.length > 0 ? (
                <div className='space-y-3 sm:space-y-4'>
                  {analytics.topCustomers.map((customer, index) => (
                    <div key={index} className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg'>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-sm sm:text-base truncate'>{customer.name}</p>
                        <p className='text-xs sm:text-sm text-muted-foreground'>{customer.orders} {t('orders')}</p>
                      </div>
                      <div className='text-left sm:text-right flex-shrink-0'>
                        <p className='font-semibold text-green-600 text-sm sm:text-base'>{customer.spent}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{t('No customers data')}</p>
                  <p className="text-sm">{t('Your top customers will appear here')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className='p-3 sm:p-6'>
            <CardTitle className='text-base sm:text-lg'>{t('Recent Activity')}</CardTitle>
          </CardHeader>
          <CardContent className='p-3 sm:p-6 pt-0'>
            {analytics.recentActivity.length > 0 ? (
              <div className='space-y-3 sm:space-y-4'>
                {analytics.recentActivity.map((activity, index) => (
                  <div key={index} className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg'>
                    <div className='flex items-center space-x-3 flex-1 min-w-0'>
                      <div className='w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0'>
                        {activity.type === 'Order' && <ShoppingCart className='h-4 w-4 text-primary' />}
                        {activity.type === 'Customer' && <Users className='h-4 w-4 text-primary' />}
                        {activity.type === 'Product' && <Eye className='h-4 w-4 text-primary' />}
                        {activity.type === 'Payment' && <DollarSign className='h-4 w-4 text-primary' />}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium text-sm sm:text-base truncate'>{activity.description}</p>
                        <p className='text-xs sm:text-sm text-muted-foreground'>{activity.time}</p>
                      </div>
                    </div>
                    {activity.amount && (
                      <Badge variant='outline' className='flex-shrink-0 text-xs'>{activity.amount}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t('No recent activity')}</p>
                <p className="text-sm">{t('Recent orders and updates will appear here')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTemplate>
  );
}