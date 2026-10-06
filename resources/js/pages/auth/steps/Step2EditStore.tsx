import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Palette } from 'lucide-react';

import { ThemePreviewCard } from './components/ThemePreviewCard';
import { getStoreThemes } from '@/data/storeThemes';

interface Step2EditStoreProps {
    store: {
        id: number;
        name_ar?: string;
        name_en: string;
        description?: string;
        email?: string;
        industry?: string;
        logo?: string;
        color?: string;
        pay_with_whatsapp?: boolean;
        whatsapp_number?: string;
        enable_custom_domain?: boolean;
        enable_custom_subdomain?: boolean;
        custom_domain?: string;
        custom_subdomain?: string;
    };
    planPermissions?: {
        enable_custdomain?: boolean;
        enable_custsubdomain?: boolean;
    };
    onSuccess: () => void;
}

const industries = [
  { id: 'fashion', name: 'Fashion' },
  { id: 'electronics', name: 'Electronics' },
  { id: 'home-decor', name: 'Home Decor' },
  { id: 'beauty-cosmetics', name: 'Beauty & Cosmetics' },
  { id: 'jewelry', name: 'Jewelry' },
  { id: 'food-beverages', name: 'Food & Beverages' },
  { id: 'books-media', name: 'Books & Media' },
  { id: 'ports-outdoors', name: 'Sports & Outdoors' },
  { id: 'toys-games', name: 'Toys & Games' },
  { id: 'other', name: 'Other' },
];

const brandColors = [
  { id: 'blue', hex: '#3b82f6' },
  { id: 'green', hex: '#10b981' },
  { id: 'purple', hex: '#8b5cf6' },
  { id: 'orange', hex: '#f97316' },
  { id: 'red', hex: '#ef4444' },
];

export default function Step2EditStore({ store, planPermissions, onSuccess }: Step2EditStoreProps) {
    const { t } = useTranslation();

    // Initialize form with store data
    const initialFormData = {
        name_ar: store?.name_ar || '',
        name_en: store?.name_en || '',
        description: store?.description || '',
        email: store?.email || '',
        industry: store?.industry || '',
        logo: null as File | null, // For file upload
        color: store?.color || brandColors[0].hex, // Default to first color
        pay_with_whatsapp: store?.pay_with_whatsapp || false,
        whatsapp_number: store?.whatsapp_number || '',
        enable_custom_domain: store?.enable_custom_domain || false,
        enable_custom_subdomain: store?.enable_custom_subdomain || false,
        custom_domain: store?.custom_domain || '',
        custom_subdomain: store?.custom_subdomain || '',
    };

    const { data, setData, post, processing, errors } = useForm(initialFormData);

    // Update form data when store changes
    useEffect(() => {
        if (store) {
            setData({
                name_ar: store.name_ar || '',
                name_en: store.name_en || '',
                description: store.description || '',
                email: store.email || '',
                industry: store.industry || '',
                logo: null, // Reset logo file input
                color: store.color || brandColors[0].hex,
                pay_with_whatsapp: store.pay_with_whatsapp || false,
                whatsapp_number: store.whatsapp_number || '',
                enable_custom_domain: store.enable_custom_domain || false,
                enable_custom_subdomain: store.enable_custom_subdomain || false,
                custom_domain: store.custom_domain || '',
                custom_subdomain: store.custom_subdomain || '',
            });
        }
    }, [store, setData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        if (type === 'file') {
            const file = (e.target as HTMLInputElement).files?.[0];
            setData(id as any, file || null);
        } else {
            setData(id as any, value);
        }
    };

    const handleSwitchChange = (field: string, checked: boolean) => {
        setData(field as any, checked);
        // If enabling one, disable the other
        if (field === 'enable_custom_domain' && checked) {
            setData('enable_custom_subdomain' as any, false);
        } else if (field === 'enable_custom_subdomain' && checked) {
            setData('enable_custom_domain' as any, false);
        }
    };

    const handleColorChange = (color: string) => {
        setData('color', color);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('register.stepper.step2'), {
            forceFormData: true,
            onSuccess: () => {
                onSuccess();
            },
        });
    };

    return (
        <div className='w-full max-w-2xl mx-auto'>
            <div className='mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                    {t('Edit Store Information')}
                </h2>
                <p className='text-gray-600 dark:text-gray-400'>
                    {t('Update your store details and configuration')}
                </p>
            </div>

            <form onSubmit={handleSubmit} className='space-y-6'>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Store Information')}</CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <Label htmlFor='name_ar'>{t('Store Name (Arabic)')}</Label>
                                <Input
                                    id='name_ar'
                                    value={data.name_ar}
                                    onChange={handleChange}
                                />
                                {errors.name_ar && (
                                    <p className='text-sm text-red-500 mt-1'>{errors.name_ar}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor='name_en'>{t('Store Name (English)')}</Label>
                                <Input
                                    id='name_en'
                                    value={data.name_en}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.name_en && (
                                    <p className='text-sm text-red-500 mt-1'>{errors.name_en}</p>
                                )}
                                <p className='text-xs text-muted-foreground mt-1'>
                                    {t('This will also be used to auto-generate your store URL.')}
                                </p>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor='industry'>{t('Industry')}</Label>
                            <Select
                                onValueChange={(value) => setData('industry', value)}
                                value={data.industry}
                            >
                                <SelectTrigger className='w-full'>
                                    <SelectValue placeholder={t('Select an industry')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {industries.map((industry) => (
                                        <SelectItem key={industry.id} value={industry.id}>
                                            {t(industry.name)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.industry && (
                                <p className='text-sm text-red-500 mt-1'>{errors.industry}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor='logo'>{t('Store Logo (Optional)')}</Label>
                            <Input
                                id='logo'
                                type='file'
                                onChange={handleChange}
                                accept='image/*'
                            />
                            {errors.logo && (
                                <p className='text-sm text-red-500 mt-1'>{errors.logo}</p>
                            )}
                        </div>

                        {/* Brand Color Picker */}
                        <div className='space-y-2'>
                            <Label htmlFor='color'>{t('Brand Color')}</Label>
                            <div className='grid grid-cols-6 gap-2'>
                                {brandColors.map((brandColor) => (
                                    <Button
                                        key={brandColor.id}
                                        type='button'
                                        variant={data.color === brandColor.hex ? 'default' : 'outline'}
                                        className='h-8 w-full p-0 relative'
                                        style={{ backgroundColor: data.color === brandColor.hex ? brandColor.hex : 'transparent' }}
                                        onClick={() => handleColorChange(brandColor.hex)}
                                    >
                                        <span
                                            className='absolute inset-1 rounded-sm'
                                            style={{ backgroundColor: brandColor.hex }}
                                        />
                                    </Button>
                                ))}
                                <div className='relative'>
                                    <Input
                                        id='customColorPicker'
                                        type='color'
                                        value={data.color}
                                        onChange={(e) => handleColorChange(e.target.value)}
                                        className='absolute inset-0 opacity-0 cursor-pointer'
                                    />
                                    <Button
                                        type='button'
                                        variant={!brandColors.some(bc => bc.hex === data.color) ? 'default' : 'outline'}
                                        className='h-8 w-full p-0 relative'
                                        style={{ backgroundColor: !brandColors.some(bc => bc.hex === data.color) ? data.color : 'transparent' }}
                                        onClick={() => handleColorChange(data.color)}
                                    >
                                        <span
                                            className='absolute inset-1 rounded-sm'
                                            style={{ backgroundColor: data.color }}
                                        />
                                    </Button>
                                </div>
                            </div>
                            {errors.color && (
                                <p className='text-sm text-red-500 mt-1'>{errors.color}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor='description'>{t('Description')}</Label>
                            <Textarea
                                id='description'
                                value={data.description}
                                onChange={handleChange}
                                rows={3}
                            />
                            {errors.description && (
                                <p className='text-sm text-red-500 mt-1'>{errors.description}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor='email'>{t('Store Email')}</Label>
                            <Input
                                id='email'
                                type='email'
                                value={data.email}
                                onChange={handleChange}
                            />
                            {errors.email && (
                                <p className='text-sm text-red-500 mt-1'>{errors.email}</p>
                            )}
                        </div>

                        {/* Pay with WhatsApp */}
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <Label htmlFor='pay_with_whatsapp'>{t('Pay with WhatsApp')}</Label>
                                    <p className='text-sm text-muted-foreground'>
                                        {t('Enable customers to pay via WhatsApp')}
                                    </p>
                                </div>
                                <Switch
                                    id='pay_with_whatsapp'
                                    checked={data.pay_with_whatsapp}
                                    onCheckedChange={(checked) => setData('pay_with_whatsapp', checked)}
                                />
                            </div>
                            {data.pay_with_whatsapp && (
                                <div>
                                    <Label htmlFor='whatsapp_number'>{t('WhatsApp Number')}</Label>
                                    <Input
                                        id='whatsapp_number'
                                        placeholder={t('+1234567890')}
                                        value={data.whatsapp_number}
                                        onChange={handleChange}
                                    />
                                    {errors.whatsapp_number && (
                                        <p className='text-sm text-red-500 mt-1'>{errors.whatsapp_number}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Domain Configuration - Commented out (disabled feature) */}

                <div className='flex justify-end'>
                    <Button type='submit' disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 className='me-2 h-4 w-4 animate-spin' />
                                {t('Saving...')}
                            </>
                        ) : (
                            t('Continue to Step 3')
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
