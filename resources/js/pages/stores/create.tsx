import React, { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { getStoreThemes } from '@/data/storeThemes';
import { ThemePreviewCard } from '@/pages/auth/steps/components/ThemePreviewCard';

interface CreateStoreProps {
  availableThemes?: any[];
  planPermissions?: Record<string, boolean>;
}

export default function CreateStore({ availableThemes = [], planPermissions = {} }: CreateStoreProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    email: '',
    theme: 'home-accessories',
    enable_custom_domain: false,
    enable_custom_subdomain: false,
    custom_domain: '',
    custom_subdomain: "",
  });
  
  // Auto-generate slug from name if slug is empty
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      // Only auto-generate slug if it"'s" empty
      slug: prev.slug === '' ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : prev.slug
    }));
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSwitchChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked,
      // If enabling one, disable the other
      ...(field === 'enable_custom_domain' && checked ? { enable_custom_subdomain: false } : {}),
      ...(field === 'enable_custom_subdomain' && checked ? { enable_custom_domain: false } : {}),
    }));
  };
  
  const handleSubmit = () => {
    router.post(route('stores.store'), formData);
  };

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className='h-4 w-4' />,
      variant: 'outline' as const,
      onClick: () => router.visit(route('stores.index'))
    },
    {
      label: t('Save Store'),
      icon: <Save className='h-4 w-4' />,
      variant: 'default' as const,
      onClick: handleSubmit
    }
  ];

  return (
    <PageTemplate
      title={t('Create Store')}
      description={t('Create a new store for your business')}
      url='/stores/create'
      actions={pageActions}
      breadcrumbs={[
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Store Management', href: route('stores.index') },
        { title: 'Create Store' }
      ]}
    >
      <div className='space-y-6'>
        <Tabs defaultValue='info' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='info'>{t('Store Information')}</TabsTrigger>
            <TabsTrigger value='theme'>{t('Store Theme')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value='info' className='space-y-4 pt-4'>
            <Card>
              <CardHeader>
                <CardTitle>{t('Store Information')}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='name'>{t('Store Name')}</Label>
                    <Input id='name' placeholder={t('Enter store name')} value={formData.name} onChange={handleNameChange} />
                  </div>
                  <div>
                    <Label htmlFor='slug'>{t('Store Slug')}</Label>
                    <Input id='slug' placeholder={t('store-slug')} value={formData.slug} onChange={handleChange} />
                    <p className='text-xs text-muted-foreground mt-1'>
                      {t('URL slug for your store. Leave empty to auto-generate from store name.')}
                    </p>
                  </div>
                </div>
                <div>
                  <Label htmlFor='description'>{t('Description')}</Label>
                  <Textarea id='description' placeholder={t('Store description')} value={formData.description} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor='email'>{t('Store Email')}</Label>
                  <Input id='email' type='email' placeholder={t('store@example.com')} value={formData.email} onChange={handleChange} />
                </div>
              </CardContent>
            </Card>
            
            {/* Domain Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>{t('Domain Configuration')}</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Custom Domain */}
                {planPermissions?.enable_custdomain && (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label htmlFor='enable_custom_domain'>{t('Enable Custom Domain')}</Label>
                        <p className='text-sm text-muted-foreground'>
                          {t('Use your own domain (e.g., example.com)')}
                        </p>
                      </div>
                      <Switch
                        id='enable_custom_domain'
                        checked={formData.enable_custom_domain}
                        onCheckedChange={(checked) => handleSwitchChange('enable_custom_domain', checked)}
                      />
                    </div>
                    {formData.enable_custom_domain && (
                      <div>
                        <Label htmlFor='custom_domain'>{t('Custom Domain')}</Label>
                        <Input
                          id='custom_domain'
                          placeholder={t('example.com')}
                          value={formData.custom_domain}
                          onChange={handleChange}
                        />
                        <p className='text-xs text-muted-foreground mt-1'>
                          {t('Point your domain A record to your server IP')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Custom Subdomain */}
                {planPermissions?.enable_custsubdomain && (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <Label htmlFor='enable_custom_subdomain'>{t('Enable Custom Subdomain')}</Label>
                        <p className='text-sm text-muted-foreground'>
                          {t('Use a subdomain (e.g., mystore.yourdomain.com)')}
                        </p>
                      </div>
                      <Switch
                        id='enable_custom_subdomain'
                        checked={formData.enable_custom_subdomain}
                        onCheckedChange={(checked) => handleSwitchChange('enable_custom_subdomain', checked)}
                      />
                    </div>
                    {formData.enable_custom_subdomain && (
                      <div>
                        <Label htmlFor='custom_subdomain'>{t('Subdomain')}</Label>
                        <Input
                          id='custom_subdomain'
                          placeholder={t('mystore')}
                          value={formData.custom_subdomain}
                          onChange={handleChange}
                        />
                        <p className='text-xs text-muted-foreground mt-1'>
                          {t('Will create: {{subdomain}}.yourdomain.com', { subdomain: formData.custom_subdomain || 'mystore' })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {!planPermissions?.enable_custdomain && !planPermissions?.enable_custsubdomain && (
                  <div className='text-center py-8'>
                    <p className='text-muted-foreground'>
                      {t('Domain features are not available in your current plan. Your store will be accessible via slug-based URL.')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value='theme' className='space-y-4 pt-4'>
            <Card>
              <CardHeader>
                <CardTitle>{t('Store Theme')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-4'>
                  {t('Choose a theme that best fits your store type and brand.')}
                </p>
                
                {availableThemes !== null && (
                  <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md'>
                    <p className='text-sm text-blue-800'>
                      <strong>{t('Plan Limitation')}:</strong> {t('Your current plan allows access to {{count}} theme(s).', { count: availableThemes.length })}
                    </p>
                  </div>
                )}
                
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {getStoreThemes().filter(theme => 
                    availableThemes === null || availableThemes.includes(theme.id)
                  ).map((theme) => (
                    <ThemePreviewCard
                      key={theme.id}
                      theme={theme}
                      isSelected={formData.theme === theme.id}
                      onSelect={(themeId) => setFormData(prev => ({ ...prev, theme: themeId }))}
                      isAvailable={availableThemes === null || availableThemes.includes(theme.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTemplate>
  );
}