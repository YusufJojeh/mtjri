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

interface EditStoreProps {
  store?: any;
  availableThemes?: any[];
  planPermissions?: Record<string, boolean>;
}

export default function EditStore({ store, availableThemes = [], planPermissions = {} }: EditStoreProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: store?.name || '',
    slug: store?.slug || '',
    description: store?.description || '',
    email: store?.email || '',
    theme: store?.theme || 'home-accessories',
    enable_custom_domain: store?.enable_custom_domain || false,
    enable_custom_subdomain: store?.enable_custom_subdomain || false,
    custom_domain: store?.custom_domain || '',
    custom_subdomain: store?.custom_subdomain || '',
  });
  
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
    router.put(route('stores.update', store.id), formData);
  };

  const pageActions = [
    {
      label: t('Back'),
      icon: <ArrowLeft className='h-4 w-4' />,
      variant: 'outline' as const,
      onClick: () => router.visit(route('stores.index'))
    },
    {
      label: t('Update Store'),
      icon: <Save className='h-4 w-4' />,
      variant: 'default' as const,
      onClick: handleSubmit
    }
  ];

  return (
    <PageTemplate 
      title={t('Edit Store')}
      description={t('Update store information and settings')}
      url='/stores/edit'
      actions={pageActions}
      breadcrumbs={[
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Store Management', href: route('stores.index') },
        { title: 'Edit Store' }
      ]}
    >
      <div className='space-y-6'>
        <Tabs defaultValue='info' className='w-full'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='info'>{t('Store Information')}</TabsTrigger>
            <TabsTrigger value='settings'>{t('Store Settings')}</TabsTrigger>
            <TabsTrigger value='content'>{t('Store Content')}</TabsTrigger>
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
                    <Input id='name' value={formData.name} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor='slug'>{t('Store Slug')}</Label>
                    <Input id='slug' value={formData.slug} onChange={handleChange} />
                    <p className='text-xs text-muted-foreground mt-1'>
                      {t('URL slug for your store. Must be unique and contain only lowercase letters, numbers, and hyphens.')}
                    </p>
                  </div>
                </div>
                <div>
                  <Label htmlFor='description'>{t('Description')}</Label>
                  <Textarea id='description' value={formData.description} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor='email'>{t('Store Email')}</Label>
                  <Input id='email' type='email' value={formData.email} onChange={handleChange} />
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
                
                <div className='mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md'>
                  <p className='text-sm text-amber-800'>
                    <strong>{t('Note')}:</strong> {t('Changing your theme will not affect your store content, but may require adjusting some layout settings.')}
                  </p>
                </div>
                
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {getStoreThemes().filter(theme => 
                    availableThemes === null || availableThemes.includes(theme.id)
                  ).map((theme) => (
                    <div 
                      key={theme.id}
                      className={`cursor-pointer rounded-lg border-2 p-1 transition-all duration-200 ${
                        formData.theme === theme.id ? 'border-primary' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, theme: theme.id }))}
                    >
                      <div className='relative aspect-video overflow-hidden rounded-md theme-preview-container'>
                        <img
                          src={theme.thumbnail}
                          alt={theme.name}
                          className='h-full w-full object-cover theme-preview-image'
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://placehold.co/300x180?text=${encodeURIComponent(theme.name)}`;
                          }}
                        />
                        {formData.theme === theme.id && (
                          <div className='absolute inset-0 flex items-center justify-center bg-primary/20'>
                            <div className='rounded-full bg-primary p-1'>
                              <Check className='h-4 w-4 text-white' />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className='p-2'>
                        <h3 className='font-medium text-sm'>{theme.name}</h3>
                        <p className='text-xs text-muted-foreground line-clamp-2'>
                          {theme.description}
                        </p>
                      </div>
                    </div>
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