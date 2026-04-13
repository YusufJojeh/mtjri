import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { getStoreThemes } from '@/data/storeThemes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface Step3ChooseThemeProps {
    store: {
        id: number;
        theme?: string;
    };
    availableThemes?: string[] | null;
    planInfo?: {
        id: number;
        name: string;
        included_themes: string[] | null; // null = all themes, array = specific themes
    } | null;
    onSuccess: (storeId: number) => void;
}

export default function Step3ChooseTheme({ store, availableThemes, planInfo, onSuccess }: Step3ChooseThemeProps) {
    const { t } = useTranslation();
    const [selectedTheme, setSelectedTheme] = useState(store?.theme || 'home-accessories');
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (store?.theme) {
            setSelectedTheme(store.theme);
        }
    }, [store]);

    const handleThemeSelect = (themeId: string) => {
        setSelectedTheme(themeId);
        // Clear errors when theme changes
        if (errors.theme) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.theme;
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const response = await axios.post(route('register.stepper.step3'), {
                theme: selectedTheme,
            }, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            if (response.data.success) {
                toast.success(t(response.data.message));
                
                // Always redirect to plans page after completing registration
                const checkoutUrl = response.data.checkoutUrl || route('plans.index');
                window.location.href = checkoutUrl;
            }
        } catch (error: any) {
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors || {};
                const formattedErrors: Record<string, string> = {};
                Object.keys(validationErrors).forEach(key => {
                    formattedErrors[key] = Array.isArray(validationErrors[key])
                        ? validationErrors[key][0]
                        : validationErrors[key];
                });
                setErrors(formattedErrors);
            } else {
                setErrors({ error: error.response?.data?.message || 'An error occurred. Please try again.' });
            }
        } finally {
            setProcessing(false);
        }
    };

    // Show ALL themes in Step 3
    const themes = getStoreThemes();
    
    // Helper function to check if theme is included in plan
    const isThemeIncluded = (themeId: string): boolean => {
        if (!planInfo) return false;
        // null means all themes are included
        if (planInfo.included_themes === null) return true;
        // array means only specific themes are included
        return Array.isArray(planInfo.included_themes) && planInfo.included_themes.includes(themeId);
    };

    return (
        <div className='w-full max-w-4xl mx-auto'>
            <div className='mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                    {t('Choose Store Theme')}
                </h2>
                <p className='text-gray-600 dark:text-gray-400'>
                    {t('Select a theme that best fits your store type and brand')}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Store Theme')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className='text-sm text-muted-foreground mb-4'>
                            {t('Choose a theme that best fits your store type and brand.')}
                        </p>

                        <div className='mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md'>
                            <p className='text-sm text-amber-800 dark:text-amber-200'>
                                <strong>{t('Note')}:</strong>{' '}
                                {t('Choose a theme for your store. Themes marked with your plan name are included in your current plan.')}
                            </p>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
                            {themes.map((theme) => {
                                const includedInPlan = isThemeIncluded(theme.id);
                                return (
                                    <div
                                        key={theme.id}
                                        className={`cursor-pointer rounded-lg border-2 p-1 transition-all duration-200 ${
                                            selectedTheme === theme.id
                                                ? 'border-primary'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                        onClick={() => handleThemeSelect(theme.id)}
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
                                            {selectedTheme === theme.id && (
                                                <div className='absolute inset-0 flex items-center justify-center bg-primary/20'>
                                                    <div className='rounded-full bg-primary p-1'>
                                                        <Check className='h-4 w-4 text-white' />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className='p-2'>
                                            <div className='flex items-center justify-between mb-1'>
                                                <h3 className='font-medium text-sm'>{theme.name}</h3>
                                                {includedInPlan && planInfo && (
                                                    <Badge variant='secondary' className='text-xs'>
                                                        {t('Included in {{planName}}', { planName: planInfo.name })}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className='text-xs text-muted-foreground line-clamp-2'>
                                                {theme.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {errors.error && (
                            <div className='mb-4 text-sm text-red-600 dark:text-red-400'>
                                {errors.error}
                            </div>
                        )}
                        {errors.theme && (
                            <div className='mb-4 text-sm text-red-600 dark:text-red-400'>
                                {errors.theme}
                            </div>
                        )}

                        <div className='flex justify-end'>
                            <Button type='submit' disabled={processing || !selectedTheme}>
                                {processing ? (
                                    <>
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        {t('Saving...')}
                                    </>
                                ) : (
                                    t('Complete Registration')
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}

