import React, { useState } from 'react';
import { PageTemplate, type PageAction } from '@/components/page-template';
import { RefreshCw, BarChart3, Download, Building2, ShoppingCart, Users, DollarSign, Package, TrendingUp, QrCode, Copy, Check, CreditCard, FileText, Tag, Activity, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Link, router, usePage } from '@inertiajs/react';
import QRCode from 'react-qr-code';
import { useCurrencyFormatter } from '@/hooks/use-store-currency';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

interface Props {
  dashboardData: {
    metrics: {
      orders?: number;
      products?: number;
      customers?: number;
      revenue?: number;
      totalCompanies?: number;
      totalPlans?: number;
      activePlans?: number;
      totalRevenue?: number;
      monthlyRevenue?: number;
      monthlyGrowth?: number;
      pendingRequests?: number;
      pendingOrders?: number;
      approvedOrders?: number;
      totalOrders?: number;
      activeCoupons?: number;
      totalCoupons?: number;
    };
    recentOrders: any[];
    topProducts?: any[];
    topPlans?: any[];
  };
  currentStore: any;
  storeUrl?: string;
  isSuperAdmin: boolean;
}

export default function Dashboard({ dashboardData, currentStore, storeUrl, isSuperAdmin }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const formatCurrency = useCurrencyFormatter();
  const { auth } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const { themeColor, customColor } = useBrand();

  // Get dynamic theme color value
  const getThemeColorValue = () => {
    return themeColor === 'custom' ? customColor : THEME_COLORS[themeColor];
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const pageActions: PageAction[] = isSuperAdmin ? [
    {
      label: t('Refresh'),
      icon: <RefreshCw className="h-4 w-4" />,
      variant: 'outline',
      onClick: () => router.reload({ only: ['dashboardData'] })
    }
  ] : [
    ...(permissions.includes('view-analytics') ? [{
      label: t('Analytics'),
      icon: <BarChart3 className="h-4 w-4" />,
      variant: 'outline',
      onClick: () => window.location.href = route('analytics.index')
    }] : []),
    ...(permissions.includes('export-dashboard') ? [{
      label: t('Export'),
      icon: <Download className="h-4 w-4" />,
      variant: 'default',
      onClick: () => window.open(route('dashboard.export'), '_blank')
    }] : [])
  ];

  // Super Admin Dashboard
  if (isSuperAdmin) {
    return (
      <PageTemplate title={t('Dashboard')} description={t('System-wide statistics and overview')} url="/dashboard" actions={pageActions}>
        <div className="space-y-4 sm:space-y-6">
          {/* Top Metric Cards */}
          <div className="grid gap-2 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">{t('Active Plans')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl sm:text-2xl font-bold">{dashboardData.metrics.activePlans || 0}</div>
                  <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t('Currently enabled subscription plans')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">{t('Pending Requests')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl sm:text-2xl font-bold">{dashboardData.metrics.pendingRequests || 0}</div>
                  <div className="p-2 sm:p-3 bg-orange-100 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t('Awaiting approval')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">{t('Monthly Growth')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl sm:text-2xl font-bold">
                    {(dashboardData.metrics.monthlyGrowth || 0) >= 0 ? '+' : ''}{dashboardData.metrics.monthlyGrowth || 0}%
                  </div>
                  <div className="p-2 sm:p-3 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t('System growing monthly')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">{t('Total Companies')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl sm:text-2xl font-bold">{dashboardData.metrics.totalCompanies || 0}</div>
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t('Registered companies')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium">{t('Total Revenue')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">{formatCurrency(dashboardData.metrics.totalRevenue || 0)}</div>
                  <div className="p-2 sm:p-3 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t('All-time earnings')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities and Top Plans */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                  {t('Recent Activity')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-3">
                  {(Array.isArray(dashboardData.recentOrders) ? dashboardData.recentOrders : []).map((order, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        order.status === 'company' || order.status === 'approved' ? 'bg-green-500' :
                        order.status === 'payment' ? 'bg-green-500' :
                        order.status === 'plan' || order.status === 'pending' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {order.company || order.description}
                        </p>
                        <p className="text-xs text-gray-500">{order.date || order.time}</p>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded font-medium ${
                        order.status === 'company' || order.status === 'approved' ? 'bg-green-100 text-green-700' :
                        order.status === 'payment' ? 'bg-green-100 text-green-700' :
                        order.status === 'plan' || order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  {t('Top Performing Plans')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-3">
                  {(Array.isArray(dashboardData.topPlans) ? dashboardData.topPlans : []).map((plan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-primary/10 text-primary' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{plan.name}</p>
                          <p className="text-sm text-gray-500">{plan.orders || plan.subscribers} {t('subscribers')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">{formatCurrency(plan.revenue || 0)}</p>
                        <p className="text-xs text-gray-500">{t('revenue')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                {t('Features')}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('Comprehensive system management and oversight tools')}</p>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <div className="group">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-shadow hover:shadow-lg">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="rounded-full p-3 bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium text-xs bg-secondary text-secondary-foreground">
                          {dashboardData.metrics.totalCompanies}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{t('Company Management')}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{t('Manage all registered companies and their subscriptions')}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between hover:bg-primary/10"
                        onClick={() => router.visit(route('companies.index'))}
                      >
                        {t('Explore')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-shadow hover:shadow-lg">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="rounded-full p-3 bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400">
                          <Package className="h-6 w-6" />
                        </div>
                        <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium text-xs bg-secondary text-secondary-foreground">
                          {dashboardData.metrics.totalPlans}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{t('Plan Management')}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{t('Create and manage subscription plans')}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between hover:bg-primary/10"
                        onClick={() => router.visit(route('plans.index'))}
                      >
                        {t('Explore')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full transition-shadow hover:shadow-lg">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="rounded-full p-3 bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400">
                          <Tag className="h-6 w-6" />
                        </div>
                        <span className="inline-flex items-center justify-center rounded-md border px-2 py-0.5 font-medium text-xs bg-secondary text-secondary-foreground">
                          {dashboardData.metrics.activeCoupons || 0}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{t('Coupon Management')}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{t('Manage system-wide coupons and discounts')}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between hover:bg-primary/10"
                        onClick={() => router.visit(route('coupons.index'))}
                      >
                        {t('Explore')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageTemplate>
    );
  }

  if (!currentStore) {
    return (
      <PageTemplate title={t('Dashboard')} description={t('Please select a store to view dashboard')} url="/dashboard">
        <div className="text-center py-12">
          <p className="text-gray-500">{t('Please select a store to view dashboard')}</p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={t('Dashboard')}
      description={t('Store dashboard and analytics')}
      url="/dashboard"
      actions={pageActions}
    >
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('Total Orders')}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl sm:text-2xl font-bold">{dashboardData.metrics.orders.toLocaleString()}</div>
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground truncate">{currentStore.name}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('Total Products')}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl sm:text-2xl font-bold">{dashboardData.metrics.products.toLocaleString()}</div>
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground">{t('Active products')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('Total Customers')}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl sm:text-2xl font-bold">{dashboardData.metrics.customers.toLocaleString()}</div>
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground">{t('Registered customers')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">{t('Total Revenue')}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">{formatCurrency(dashboardData.metrics.revenue)}</div>
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground">{t('All time revenue')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">{t('Recent Orders')}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {(Array.isArray(dashboardData.recentOrders) ? dashboardData.recentOrders : []).map((order, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-0 border-b sm:border-0 last:border-0">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={route('orders.show', order.id)}
                        className="font-medium hover:underline text-sm sm:text-base break-words"
                        style={{ color: getThemeColorValue() }}
                      >
                        {order.order_number}
                      </Link>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{order.customer}</p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="font-medium text-sm sm:text-base">{formatCurrency(order.amount)}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">{t('Top Products')}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {(Array.isArray(dashboardData.topProducts) ? dashboardData.topProducts : []).map((product, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-0 border-b sm:border-0 last:border-0">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={route('products.show', product.id)}
                        className="font-medium hover:underline text-sm sm:text-base break-words"
                        style={{ color: getThemeColorValue() }}
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs sm:text-sm text-muted-foreground">{product.sold} {t('sold')}</p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="font-medium text-sm sm:text-base">{formatCurrency(product.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('Store QR Code')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                <div className="bg-white p-3 sm:p-4 rounded-lg">
                  <QRCode value={storeUrl} size={120} className="w-full max-w-[120px] h-auto" />
                </div>
                <div className="text-center space-y-2 w-full">
                  <p className="text-sm sm:text-base font-medium truncate px-2">{currentStore.name}</p>
                  <p className="text-xs text-muted-foreground">{t('Scan to visit store')}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? t('Copied!') : t('Copy Link')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}
