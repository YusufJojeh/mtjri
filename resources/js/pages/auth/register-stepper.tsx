import React, { useState, useEffect } from 'react';
import { accessibleBrand } from '@/lib/commerce/color';
import { Stepper, StepperStep } from '@/components/ui/stepper';
import Step1Register from './steps/Step1Register';
import Step2EditStore from './steps/Step2EditStore';
import Step3ChooseTheme from './steps/Step3ChooseTheme';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from 'react-i18next';
import { router, usePage } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';

interface RegisterStepperProps {
    referralCode?: string;
    planId?: string;
    store?: {
        id: number;
        name: string;
        slug: string;
        description?: string;
        email?: string;
        theme?: string;
        enable_custom_domain?: boolean;
        enable_custom_subdomain?: boolean;
        custom_domain?: string;
        custom_subdomain?: string;
    };
    availableThemes?: string[] | null;
    planInfo?: {
        id: number;
        name: string;
        included_themes: string[] | null;
    } | null;
    planPermissions?: {
        enable_custdomain?: boolean;
        enable_custsubdomain?: boolean;
    };
    currentStep?: number;
}

export default function RegisterStepper({
    referralCode,
    planId,
    store: initialStore,
    availableThemes: initialThemes,
    planInfo: initialPlanInfo,
    planPermissions: initialPermissions,
    currentStep: initialStep = 1,
}: RegisterStepperProps) {
    const { t } = useTranslation();
    const { themeColor, customColor } = useBrand();
    const primaryColor = accessibleBrand(themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS]);
    const { props: pageProps } = usePage();
    const props = pageProps as any;
    
    // Use state for current step and data (can be updated client-side)
    const [currentStep, setCurrentStep] = useState(props?.currentStep ?? initialStep);
    const [store, setStore] = useState(props?.store ?? initialStore);
    const [availableThemes, setAvailableThemes] = useState(props?.availableThemes ?? initialThemes);
    const [planPermissions, setPlanPermissions] = useState(props?.planPermissions ?? initialPermissions);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);

    // Update from props when they change (e.g., from Step 2/3 submissions via Inertia)
    useEffect(() => {
        if (props?.currentStep) {
            setCurrentStep(props.currentStep);
        }
        if (props?.store) {
            setStore(props.store);
        }
        if (props?.availableThemes !== undefined) {
            setAvailableThemes(props.availableThemes);
        }
        if (props?.planPermissions) {
            setPlanPermissions(props.planPermissions);
        }
    }, [props]);

    // Update completed steps based on current step
    useEffect(() => {
        if (currentStep >= 2) {
            setCompletedSteps([1]);
        }
        if (currentStep >= 3) {
            setCompletedSteps([1, 2]);
        }
        if (currentStep > 3) {
            setCompletedSteps([1, 2, 3]);
        }
    }, [currentStep]);

    const steps: StepperStep[] = [
        {
            id: 'register',
            title: t('Register & Create Store'),
            description: t('Create your account and store'),
        },
        {
            id: 'edit-store',
            title: t('Edit Store Information'),
            description: t('Configure your store details'),
        },
        {
            id: 'choose-theme',
            title: t('Choose Store Theme'),
            description: t('Select your store theme'),
        },
    ];

    const handleStep1Success = (data: {
        store: any;
        availableThemes: string[] | null;
        planPermissions: any;
    }) => {
        // Update state with the response data
        // This will trigger a re-render showing Step 2
        setStore(data.store);
        setAvailableThemes(data.availableThemes);
        setPlanPermissions(data.planPermissions);
        setCurrentStep(2);
        setCompletedSteps([1]);
    };

    const handleStep2Success = () => {
        // Backend will return new props with currentStep=3
        // Component will re-render automatically
    };

    const handleStep3Success = (storeId: number) => {
        // Navigation is handled in Step3ChooseTheme component
        // This callback is called after successful API call
    };

    const handleStepClick = (stepIndex: number) => {
        // Only allow navigation to completed steps or current step
        const targetStep = stepIndex + 1;
        if (completedSteps.includes(targetStep) || targetStep === currentStep) {
            // Navigate by reloading with the target step
            router.reload({
                data: { step: targetStep },
                only: ['currentStep'],
            });
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1Register
                        referralCode={referralCode}
                        planId={planId}
                        onSuccess={handleStep1Success}
                    />
                );
            case 2:
                if (!store) {
                    return (
                        <div className='text-center py-8'>
                            <p className='text-gray-600 dark:text-gray-400'>
                                {t('Loading store information...')}
                            </p>
                        </div>
                    );
                }
                return (
                    <Step2EditStore
                        store={store}
                        planPermissions={planPermissions}
                        onSuccess={handleStep2Success}
                    />
                );
            case 3:
                if (!store) {
                    return (
                        <div className='text-center py-8'>
                            <p className='text-gray-600 dark:text-gray-400'>
                                {t('Loading store information...')}
                            </p>
                        </div>
                    );
                }
                return (
                    <Step3ChooseTheme
                        store={store}
                        availableThemes={availableThemes}
                        planInfo={props?.planInfo ?? initialPlanInfo}
                        onSuccess={handleStep3Success}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <AuthLayout
            title={t('Complete Your Registration')}
            description={t('Follow these steps to set up your store')}
            size='wide'
        >
            <div className='w-full max-w-4xl mx-auto'>
                <div className='mb-8'>
                    <Stepper
                        steps={steps}
                        currentStep={currentStep - 1}
                        onStepClick={handleStepClick}
                        allowNavigation={true}
                    />
                </div>

                <div className='mt-8'>
                    {renderStepContent()}
                </div>

                {/* Navigation Links */}
                <div className='text-center text-sm text-gray-600 dark:text-gray-400 mt-8 space-y-2'>
                    <div>
                        {t('Already have an account?')}{' '}
                        <TextLink 
                            href={route('login')} 
                            className='font-medium transition-colors duration-200' 
                            style={{ color: primaryColor }}
                        >
                            {t('Log in')}
                        </TextLink>
                    </div>
                    <div>
                        {t('Back to')}{' '}
                        <TextLink 
                            href={route('home')} 
                            className='font-medium transition-colors duration-200' 
                            style={{ color: primaryColor }}
                        >
                            {t('Home')}
                        </TextLink>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}

