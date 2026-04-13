import { Mail, Lock, User } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import AuthButton from '@/components/auth/auth-button';
import Recaptcha from '@/components/recaptcha';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import { router } from '@inertiajs/react';
import axios from 'axios';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    terms: boolean;
    recaptcha_token?: string;
    plan_id?: string;
    referral_code?: string;
};

interface Step1RegisterProps {
    referralCode?: string;
    planId?: string;
    onSuccess: (data: {
        store: any;
        availableThemes: string[] | null;
        planPermissions: any;
    }) => void;
}

export default function Step1Register({ referralCode, planId, onSuccess }: Step1RegisterProps) {
    const { t } = useTranslation();
    const [recaptchaToken, setRecaptchaToken] = useState<string>('');
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const [formData, setFormData] = useState<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        terms: false,
        plan_id: planId,
        referral_code: referralCode,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (field: keyof RegisterForm, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const response = await axios.post(route('register.stepper.step1'), {
                ...formData,
                recaptcha_token: recaptchaToken,
            }, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            if (response.data.success) {
                // Clear password fields
                setFormData(prev => ({
                    ...prev,
                    password: '',
                    password_confirmation: '',
                }));

                // Call onSuccess with the response data
                onSuccess({
                    store: response.data.store,
                    availableThemes: response.data.availableThemes,
                    planPermissions: response.data.planPermissions,
                });
            }
        } catch (error: any) {
            if (error.response?.status === 422) {
                // Validation errors
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

    return (
        <div className='w-full max-w-md mx-auto'>
            <div className='mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
                    {t('Create your account')}
                </h2>
                <p className='text-gray-600 dark:text-gray-400'>
                    {t('Enter your details below to get started')}
                </p>
            </div>

            <form className='space-y-5' onSubmit={submit}>
                <div className='space-y-4'>
                    <div className='relative'>
                        <Label htmlFor='name' className='text-gray-700 dark:text-gray-300 font-medium mb-1 block'>
                            {t('Full name')}
                        </Label>
                        <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                <User className='h-5 w-5 text-gray-400' />
                            </div>
                            <Input
                                id='name'
                                type='text'
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete='name'
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder={t('John Doe')}
                                className='pl-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg transition-all duration-200'
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.name} />
                    </div>

                    <div className='relative'>
                        <Label htmlFor='email' className='text-gray-700 dark:text-gray-300 font-medium mb-1 block'>
                            {t('Email address')}
                        </Label>
                        <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                <Mail className='h-5 w-5 text-gray-400' />
                            </div>
                            <Input
                                id='email'
                                type='email'
                                required
                                tabIndex={2}
                                autoComplete='email'
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder='email@example.com'
                                className='pl-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg transition-all duration-200'
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    <div>
                        <Label htmlFor='password' className='text-gray-700 dark:text-gray-300 font-medium mb-1 block'>
                            {t('Password')}
                        </Label>
                        <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                <Lock className='h-5 w-5 text-gray-400' />
                            </div>
                            <Input
                                id='password'
                                type='password'
                                required
                                tabIndex={3}
                                autoComplete='new-password'
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                placeholder='••••••••'
                                className='pl-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg transition-all duration-200'
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div>
                        <Label htmlFor='password_confirmation' className='text-gray-700 dark:text-gray-300 font-medium mb-1 block'>
                            {t('Confirm password')}
                        </Label>
                        <div className='relative'>
                            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                                <Lock className='h-5 w-5 text-gray-400' />
                            </div>
                            <Input
                                id='password_confirmation'
                                type='password'
                                required
                                tabIndex={4}
                                autoComplete='new-password'
                                value={formData.password_confirmation}
                                onChange={(e) => handleChange('password_confirmation', e.target.value)}
                                placeholder='••••••••'
                                className='pl-10 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg transition-all duration-200'
                                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                            />
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>

                    <div className='flex items-start'>
                        <Checkbox
                            id='terms'
                            name='terms'
                            checked={formData.terms}
                            onClick={() => handleChange('terms', !formData.terms)}
                            tabIndex={5}
                            className='mt-1 border-gray-300 rounded'
                            style={{ '--tw-ring-color': primaryColor, color: primaryColor } as React.CSSProperties}
                        />
                        <Label htmlFor='terms' className='ml-2 text-gray-600 dark:text-gray-400 text-sm'>
                            {t('I agree to the')}{' '}
                            <a href='#' style={{ color: primaryColor }}>
                                {t('Terms and Conditions')}
                            </a>
                        </Label>
                    </div>
                    <InputError message={errors.terms} />
                    {errors.error && (
                        <div className='text-sm text-red-600 dark:text-red-400 mt-2'>
                            {errors.error}
                        </div>
                    )}
                </div>

                <Recaptcha 
                    onVerify={setRecaptchaToken}
                    onExpired={() => setRecaptchaToken('')}
                    onError={() => setRecaptchaToken('')}
                />

                <AuthButton 
                    tabIndex={6} 
                    processing={processing}
                >
                    {t('Create account')}
                </AuthButton>
            </form>
        </div>
    );
}

