import React from 'react';
import { Link } from '@inertiajs/react';
import { Check, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';

const encryptPlanId = (planId: number): string => {
    const key = 'StoreGo2024';
    const value = String(planId);
    let encrypted = '';

    for (let i = 0; i < value.length; i += 1) {
        encrypted += String.fromCharCode(value.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }

    return btoa(encrypted);
};

interface Plan {
    id: number;
    name: string;
    description: string;
    price: number;
    yearly_price?: number | null;
    duration: string;
    features?: string[];
    is_popular?: boolean;
    is_plan_enable: string;
    stats?: {
        stores?: number | null;
        users_per_store?: number | null;
        products_per_store?: number | null;
        storage?: string | null;
        themes?: number | null;
        trial_days?: number | null;
    };
}

interface PlansSectionProps {
    brandColor?: string;
    plans: Plan[];
    settings?: any;
}

export default function PlansSection({ plans, settings, brandColor = '#1E90FF' }: PlansSectionProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;
    const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');

    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#1578D8', accent: '#FFC107' };
    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);
    const secondaryColor = sanitizeLandingHex(colors.secondary, '#1578D8');
    const accentColor = sanitizeLandingHex(colors.accent, '#FFC107');

    const enabledPlans = React.useMemo(
        () =>
            plans
                .filter((plan) => plan.is_plan_enable === 'on')
                .sort((a, b) => Number(a.price) - Number(b.price)),
        [plans],
    );

    const formatCurrency = React.useCallback((amount: number | string) => {
        const numericAmount = typeof amount === 'number' ? amount : Number(amount || 0);

        if (typeof window !== 'undefined' && window.appSettings?.formatCurrency) {
            return window.appSettings.formatCurrency(numericAmount, { showSymbol: true });
        }

        return numericAmount.toLocaleString(undefined, {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: numericAmount % 1 === 0 ? 0 : 2,
        });
    }, []);

    const getPrice = React.useCallback(
        (plan: Plan) => (billingCycle === 'yearly' && plan.yearly_price != null ? plan.yearly_price : plan.price),
        [billingCycle],
    );

    const getSavingsLabel = React.useCallback(
        (plan: Plan) => {
            if (plan.yearly_price == null || !plan.price) {
                return null;
            }

            const annualAtMonthlyRate = Number(plan.price) * 12;
            if (!annualAtMonthlyRate) {
                return null;
            }

            const savings = Math.max(0, Math.round(((annualAtMonthlyRate - Number(plan.yearly_price)) / annualAtMonthlyRate) * 100));
            return savings > 0 ? t('landing.v2.pricing.savings', { defaultValue: `Save ${savings}% yearly` }) : null;
        },
        [t],
    );

    if (!enabledPlans.length) {
        return null;
    }

    return (
        <section id="pricing" className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24 lg:py-28">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 16% 18%, ${primaryColor}24, transparent 28%), radial-gradient(circle at 80% 16%, ${accentColor}18, transparent 22%), linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,1))`,
                }}
                aria-hidden
            />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="mx-auto max-w-3xl text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={LANDING_VIEWPORT}
                    variants={landingContainer}
                    custom={reduce}
                >
                    <motion.span
                        variants={landingFadeUp}
                        custom={reduce}
                        className="inline-flex rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72"
                    >
                        {t('landing.v2.pricing.badge', 'Plans')}
                    </motion.span>
                    <motion.h2
                        variants={landingFadeUp}
                        custom={reduce}
                        className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
                    >
                        {t('landing.v2.pricing.title', 'Choose the plan that matches the number of stores you need to run')}
                    </motion.h2>
                    <motion.p
                        variants={landingFadeUp}
                        custom={reduce}
                        className="mt-5 text-lg leading-relaxed text-white/68"
                    >
                        {t(
                            'landing.v2.pricing.subtitle',
                            'The pricing section now reflects the current plan schema: stores, users, products, storage, theme access, and feature gates pulled from the app.',
                        )}
                    </motion.p>

                    <motion.div
                        variants={landingFadeUp}
                        custom={reduce}
                        className="mt-8 inline-flex items-center gap-4 rounded-full border border-white/12 bg-white/[0.05] p-2 shadow-sm backdrop-blur-sm"
                    >
                        <button
                            type="button"
                            onClick={() => setBillingCycle('monthly')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                billingCycle === 'monthly' ? 'text-white' : 'text-white/62'
                            }`}
                            style={{
                                backgroundColor: billingCycle === 'monthly' ? primaryColor : 'transparent',
                            }}
                        >
                            {t('landing.pricing.monthly', 'Monthly')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setBillingCycle('yearly')}
                            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                                billingCycle === 'yearly' ? 'text-white' : 'text-white/62'
                            }`}
                            style={{
                                backgroundColor: billingCycle === 'yearly' ? primaryColor : 'transparent',
                            }}
                        >
                            {t('landing.pricing.yearly', 'Yearly')}
                        </button>
                    </motion.div>
                </motion.div>

                <div className="mt-14 grid gap-5 lg:grid-cols-3">
                    {enabledPlans.map((plan, index) => {
                        const currentPrice = getPrice(plan);
                        const stats = [
                            { label: t('landing.v2.pricing.stats.stores', 'Stores'), value: plan.stats?.stores ?? '-' },
                            {
                                label: t('landing.v2.pricing.stats.users', 'Users / store'),
                                value: plan.stats?.users_per_store ?? '-',
                            },
                            {
                                label: t('landing.v2.pricing.stats.products', 'Products / store'),
                                value: plan.stats?.products_per_store ?? '-',
                            },
                            { label: t('landing.pricing.storage', 'Storage'), value: plan.stats?.storage ?? '-' },
                        ];

                        const savingsLabel = getSavingsLabel(plan);

                        return (
                            <motion.article
                                key={plan.id}
                                initial={reduce ? false : { opacity: 0, y: 18 }}
                                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                viewport={LANDING_VIEWPORT}
                                transition={landingRevealTransition(reduce, index)}
                                className={`landing-pricing-lift relative flex h-full flex-col rounded-[1.85rem] border p-6 shadow-sm ${
                                    plan.is_popular
                                        ? 'border-[var(--primary-color)] bg-slate-950 text-white shadow-[0_34px_80px_-44px_rgba(15,23,42,0.7)]'
                                        : 'border-white/12 bg-white/[0.05] text-white shadow-[0_28px_70px_-34px_rgba(0,0,0,0.6)] backdrop-blur-sm'
                                }`}
                            >
                                {plan.is_popular ? (
                                    <div className="absolute inset-x-0 -top-3 flex justify-center">
                                        <span
                                            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950 shadow-sm"
                                            style={{ backgroundColor: accentColor }}
                                        >
                                            <Sparkles className="h-3.5 w-3.5" aria-hidden />
                                            {t('landing.pricing.recommended', 'Recommended')}
                                        </span>
                                    </div>
                                ) : null}

                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p
                                            className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
                                                plan.is_popular ? 'text-white/52' : 'text-white/42'
                                            }`}
                                        >
                                            {t('landing.v2.pricing.planLabel', 'Plan')}
                                        </p>
                                        <h3 className={`mt-3 text-2xl font-semibold tracking-tight ${plan.is_popular ? 'text-white' : 'text-white'}`}>
                                            {plan.name}
                                        </h3>
                                        <p className={`mt-3 text-sm leading-relaxed ${plan.is_popular ? 'text-white/70' : 'text-white/68'}`}>
                                            {plan.description}
                                        </p>
                                    </div>

                                    {savingsLabel ? (
                                        <span
                                            className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                                            style={{
                                                backgroundColor: plan.is_popular ? 'rgba(255,255,255,0.1)' : `${accentColor}18`,
                                                color: plan.is_popular ? accentColor : secondaryColor,
                                            }}
                                        >
                                            {savingsLabel}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="mt-7 flex items-end gap-2">
                                    <span className={`text-4xl font-semibold tracking-tight ${plan.is_popular ? 'text-white' : 'text-slate-950'}`}>
                                        {formatCurrency(currentPrice)}
                                    </span>
                                    <span className={`pb-1 text-sm ${plan.is_popular ? 'text-white/60' : 'text-white/52'}`}>
                                        /{billingCycle === 'yearly' ? t('landing.pricing.yearly', 'Yearly').toLowerCase() : t('landing.pricing.monthly', 'Monthly').toLowerCase()}
                                    </span>
                                </div>

                                <div className={`mt-7 grid grid-cols-2 gap-3 rounded-[1.4rem] border p-4 ${
                                    plan.is_popular ? 'border-white/10 bg-white/[0.05]' : 'border-white/10 bg-black/20'
                                }`}>
                                    {stats.map((stat) => (
                                        <div key={stat.label} className="rounded-2xl border border-transparent bg-white/0 p-2">
                                            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${plan.is_popular ? 'text-white/45' : 'text-white/38'}`}>
                                                {stat.label}
                                            </p>
                                            <p className={`mt-2 text-lg font-semibold ${plan.is_popular ? 'text-white' : 'text-white'}`}>
                                                {stat.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {plan.stats?.themes ? (
                                    <p className={`mt-4 text-sm ${plan.is_popular ? 'text-white/62' : 'text-white/64'}`}>
                                        {t('landing.v2.pricing.themeAccess', {
                                            count: plan.stats.themes,
                                            defaultValue: '{{count}} storefront themes included',
                                        })}
                                    </p>
                                ) : null}

                                {plan.stats?.trial_days ? (
                                    <p className={`mt-2 text-sm ${plan.is_popular ? 'text-white/62' : 'text-white/64'}`}>
                                        {t('landing.v2.pricing.trial', {
                                            count: plan.stats.trial_days,
                                            defaultValue: '{{count}}-day trial available',
                                        })}
                                    </p>
                                ) : null}

                                <ul className="mt-7 space-y-3">
                                    {(plan.features || []).map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <span
                                                className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                                    plan.is_popular ? 'border-white/12 bg-white/[0.08]' : 'border-white/10 bg-white/[0.04]'
                                                }`}
                                                style={{ color: primaryColor }}
                                            >
                                                <Check className="h-3.5 w-3.5" aria-hidden />
                                            </span>
                                            <span className={`text-sm leading-relaxed ${plan.is_popular ? 'text-white/76' : 'text-white/68'}`}>
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-8 pt-6">
                                    <Link
                                        href={route('register.stepper.index', { plan: encryptPlanId(plan.id) })}
                                        className={`landing-cta-depth inline-flex w-full items-center justify-center rounded-2xl border px-5 py-3.5 text-sm font-semibold transition ${
                                            plan.is_popular
                                                ? 'border-[var(--primary-color)] bg-[var(--primary-color)] text-white hover:brightness-110'
                                                : 'border-white/12 bg-white text-slate-950 hover:bg-slate-100'
                                        }`}
                                    >
                                        {currentPrice === 0 ? t('landing.pricing.startFree', 'Start Free') : t('landing.pricing.getStarted', 'Get Started')}
                                    </Link>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
