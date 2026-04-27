import React from 'react';
import { Link } from '@inertiajs/react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useBrand } from '@/contexts/BrandContext';
import { getMarketingLogoDisplayUrl, PUBLIC_BRAND_PRIMARY } from '@/lib/public-brand';

interface FooterProps {
    brandColor?: string;
    settings: {
        company_name: string;
        contact_email: string;
        contact_phone: string;
        contact_address: string;
    };
}

export default function Footer({ settings, brandColor = PUBLIC_BRAND_PRIMARY }: FooterProps) {
    const { t } = useTranslation();
    const { logoLight, logoDark } = useBrand();
    const currentYear = new Date().getFullYear();
    const footerLogoSrc = getMarketingLogoDisplayUrl(logoLight, logoDark, true);

    const home = route('home');
    const hash = (id: string) => `${home}#${id}`;

    const productLinks = [
        { label: t('landing.cinematic.footer.links.platform'), href: hash('platform'), external: true },
        { label: t('landing.cinematic.footer.links.motion'), href: hash('motion-story'), external: true },
        { label: t('landing.cinematic.footer.links.proof'), href: hash('proof'), external: true },
        { label: t('landing.cinematic.footer.links.themes'), href: hash('themes'), external: true },
    ];

    const resourceLinks = [
        { label: t('documentation.title'), href: route('documentation.index'), external: false },
        { label: t('landing.cinematic.footer.links.contact'), href: route('contact'), external: false },
        { label: t('Privacy Policy'), href: route('privacy'), external: false },
        { label: t('Terms of Service'), href: route('terms'), external: false },
    ];

    const proofChips = [
        t('landing.cinematic.footer.proof.one'),
        t('landing.cinematic.footer.proof.two'),
        t('landing.cinematic.footer.proof.three'),
    ];

    return (
        <footer className="relative mt-6 overflow-hidden bg-slate-950 text-white">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 12% 18%, ${brandColor}22, transparent 28%), radial-gradient(circle at 82% 20%, rgba(255,193,7,0.14), transparent 22%), linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,1))`,
                }}
                aria-hidden
            />
            <div className="border-b border-white/10">
                <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:px-8">
                    <div className="max-w-2xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/44">
                            {t('landing.cinematic.footer.ctaBadge')}
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                            {t('landing.cinematic.footer.ctaTitle')}
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-white/68">
                            {t('landing.cinematic.footer.ctaSubtitle')}
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        <Link
                            href={route('register.stepper.index')}
                            className="landing-cta-depth inline-flex items-center justify-center rounded-2xl border border-[var(--primary-color)] bg-[var(--primary-color)] px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
                        >
                            {t('landing.cinematic.footer.primaryCta')}
                        </Link>
                        <a
                            href="#motion-story"
                            className="landing-cta-depth inline-flex items-center justify-center rounded-2xl border border-white/18 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                        >
                            {t('landing.cinematic.footer.secondaryCta')}
                        </a>
                    </div>
                </div>
            </div>

            <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.6fr)_minmax(0,0.65fr)_minmax(0,0.75fr)]">
                    <div>
                        <div className="inline-flex items-center rounded-[1.4rem] border border-white/12 bg-white/[0.04] px-4 py-3 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.7)]">
                            <img
                                src={footerLogoSrc}
                                alt={settings.company_name}
                                className="h-9 w-auto max-w-[144px] object-contain"
                            />
                        </div>
                        <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/66 sm:text-base">
                            {t('landing.cinematic.footer.description')}
                        </p>
                        <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/42">
                                {t('landing.cinematic.footer.sceneLabel')}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-white/72">
                                {t('landing.cinematic.footer.sceneBody')}
                            </p>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                            {proofChips.map((chip) => (
                                <span
                                    key={chip}
                                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70"
                                >
                                    {chip}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                            {t('landing.cinematic.footer.columns.product')}
                        </h3>
                        <ul className="mt-5 space-y-3 text-sm text-white/68">
                            {productLinks.map((link) => (
                                <li key={link.label}>
                                    {link.external ? (
                                        <a href={link.href} className="transition hover:text-white">
                                            {link.label}
                                        </a>
                                    ) : (
                                        <Link href={link.href} className="transition hover:text-white">
                                            {link.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                            {t('landing.cinematic.footer.columns.resources')}
                        </h3>
                        <ul className="mt-5 space-y-3 text-sm text-white/68">
                            {resourceLinks.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="transition hover:text-white">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/44">
                            {t('landing.cinematic.footer.columns.contact')}
                        </h3>
                        <div className="mt-5 space-y-4 text-sm text-white/68">
                            {settings.contact_email ? (
                                <a href={`mailto:${settings.contact_email}`} className="flex items-start gap-3 transition hover:text-white">
                                    <Mail className="mt-0.5 h-4 w-4 shrink-0" style={{ color: brandColor }} aria-hidden />
                                    <span>{settings.contact_email}</span>
                                </a>
                            ) : null}
                            {settings.contact_phone ? (
                                <p className="flex items-start gap-3">
                                    <Phone className="mt-0.5 h-4 w-4 shrink-0" style={{ color: brandColor }} aria-hidden />
                                    <span>{settings.contact_phone}</span>
                                </p>
                            ) : null}
                            {settings.contact_address ? (
                                <p className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: brandColor }} aria-hidden />
                                    <span>{settings.contact_address}</span>
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/44 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        {currentYear} {settings.company_name}. {t('landing.footer.allRightsReserved')}
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href={route('privacy')} className="transition hover:text-white">
                            {t('Privacy Policy')}
                        </Link>
                        <Link href={route('terms')} className="transition hover:text-white">
                            {t('Terms of Service')}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
