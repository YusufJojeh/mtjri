import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Check, ChevronRight, CircleDashed, ExternalLink, Rocket, SkipForward, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { Panel } from '@/components/ds/layout';
import { ToneBadge } from '@/components/ds/status-badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Step {
    id: string;
    status: 'done' | 'skipped' | 'todo';
    required: boolean;
    skippable: boolean;
    derived: boolean;
    detail: Record<string, unknown>;
    href: string | null;
}

interface PageProps {
    steps: Step[];
    progress: { completed: number; total: number; percent: number; next: string | null };
    store: { id: number; name: string; description: string | null; is_active: boolean; slug: string };
    ai_preferences: { tone: string; language: string; emoji: boolean };
}

const COPY: Record<string, { title: string; body: string; cta: string }> = {
    identity: { title: 'Name and describe your store', body: 'Customers and Tijraa use this to understand what you sell.', cta: 'Save details' },
    brand: { title: 'Add your logo and colors', body: 'Your storefront and emails use your brand.', cta: 'Open store settings' },
    products: { title: 'Add your first product', body: 'At least one active product is needed before you can sell.', cta: 'Add a product' },
    payments: { title: 'Turn on a payment method', body: 'Choose how customers pay — card, bank transfer, cash on delivery or WhatsApp.', cta: 'Payment settings' },
    shipping: { title: 'Set up shipping', body: 'Add at least one active shipping method.', cta: 'Shipping methods' },
    policies: { title: 'Publish your policies', body: 'Returns, shipping and privacy pages build trust — and Tijraa can answer questions about them.', cta: 'Pages' },
    domain: { title: 'Connect a domain', body: 'Optional: use your own domain or subdomain.', cta: 'Domain settings' },
    knowledge: { title: 'Teach Tijraa about your brand', body: 'Upload a brand guide or FAQ so AI copy sounds like you.', cta: 'Open Knowledge' },
    ai_preferences: { title: 'Choose how Tijraa writes', body: 'Tone and language for AI drafts and answers.', cta: 'Save preferences' },
    go_live: { title: 'Go live', body: 'Open your store to customers.', cta: 'Go live' },
};

const TONES = ['friendly', 'professional', 'playful', 'luxury', 'concise'];

export default function Onboarding() {
    const { t } = useTranslation();
    const { steps, progress, store, ai_preferences } = usePage().props as unknown as PageProps;
    const [openId, setOpenId] = useState<string | null>(progress.next);
    const identity = useForm({ name: store.name ?? '', description: store.description ?? '' });
    const prefs = useForm({ tone: ai_preferences.tone, language: ai_preferences.language, emoji: !!ai_preferences.emoji });
    const post = (name: string, step: string) => router.post(route(name, step), {}, { preserveScroll: true });

    return (
        <PageTemplate title={t('Setup guide')} description={t('Everything your store needs before launch. Steps complete automatically when the work is done.')} url="/onboarding" width="narrow">
            <div className="space-y-5">
                <Panel>
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{t('{{done}} of {{total}} steps finished', { done: progress.completed, total: progress.total })}</p>
                        {store.is_active && <ToneBadge tone="success">{t('Store is live')}</ToneBadge>}
                    </div>
                    <Progress value={progress.percent} className="mt-3 h-2" aria-label={t('Setup progress')} />
                </Panel>

                <ol className="space-y-2">
                    {steps.map((s, idx) => {
                        const c = COPY[s.id];
                        const open = openId === s.id;
                        return (
                            <li key={s.id} className={cn('bg-card rounded-xl border', open && 'ring-ring/20 ring-2')}>
                                <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-start" aria-expanded={open} onClick={() => setOpenId(open ? null : s.id)}>
                                    <span
                                        className={cn(
                                            'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                            s.status === 'done' ? 'bg-success text-white' : s.status === 'skipped' ? 'bg-muted text-muted-foreground' : 'border',
                                        )}
                                        aria-hidden
                                    >
                                        {s.status === 'done' ? <Check className="size-4" /> : s.status === 'skipped' ? <SkipForward className="size-3.5" /> : idx + 1}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className={cn('block text-sm font-medium', s.status !== 'todo' && 'text-muted-foreground')}>{t(c.title)}</span>
                                        <span className="sr-only">{s.status === 'done' ? t('Done') : s.status === 'skipped' ? t('Skipped') : t('To do')}</span>
                                    </span>
                                    {!s.required && s.status === 'todo' && <span className="text-muted-foreground text-xs">{t('Optional')}</span>}
                                    <ChevronRight className={cn('text-muted-foreground size-4 transition-transform rtl:rotate-180', open && 'rotate-90 rtl:rotate-90')} aria-hidden />
                                </button>
                                {open && (
                                    <div className="space-y-3 border-t px-4 py-4 sm:ps-14">
                                        <p className="text-muted-foreground text-sm">{t(c.body)}</p>

                                        {s.id === 'identity' && (
                                            <form
                                                className="space-y-2"
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    identity.post(route('onboarding.identity'), { preserveScroll: true });
                                                }}
                                            >
                                                <label className="block text-xs font-medium" htmlFor="ob-name">
                                                    {t('Store name')}
                                                </label>
                                                <input id="ob-name" value={identity.data.name} onChange={(e) => identity.setData('name', e.target.value)} className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm" />
                                                <label className="block text-xs font-medium" htmlFor="ob-desc">
                                                    {t('Short description')}
                                                </label>
                                                <textarea id="ob-desc" rows={3} value={identity.data.description} onChange={(e) => identity.setData('description', e.target.value)} className="border-input bg-background w-full rounded-lg border p-3 text-sm" />
                                                {Object.values(identity.errors)[0] && <p className="text-danger-fg text-xs">{Object.values(identity.errors)[0]}</p>}
                                                <Button size="sm" type="submit" disabled={identity.processing}>
                                                    {t(c.cta)}
                                                </Button>
                                            </form>
                                        )}

                                        {s.id === 'ai_preferences' && (
                                            <form
                                                className="space-y-3"
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    prefs.post(route('onboarding.complete', 'ai_preferences'), { preserveScroll: true });
                                                }}
                                            >
                                                <fieldset>
                                                    <legend className="mb-1.5 text-xs font-medium">{t('Tone')}</legend>
                                                    <div className="flex flex-wrap gap-2">
                                                        {TONES.map((tone) => (
                                                            <button
                                                                key={tone}
                                                                type="button"
                                                                aria-pressed={prefs.data.tone === tone}
                                                                onClick={() => prefs.setData('tone', tone)}
                                                                className={cn('rounded-full border px-3 py-1 text-sm', prefs.data.tone === tone && 'bg-foreground text-background')}
                                                            >
                                                                {t(tone.charAt(0).toUpperCase() + tone.slice(1))}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </fieldset>
                                                <fieldset>
                                                    <legend className="mb-1.5 text-xs font-medium">{t('Language')}</legend>
                                                    <div className="flex flex-wrap gap-2">
                                                        {[
                                                            ['auto', 'Match my content'],
                                                            ['English', 'English'],
                                                            ['Arabic', 'Arabic'],
                                                        ].map(([v, l]) => (
                                                            <button key={v} type="button" aria-pressed={prefs.data.language === v} onClick={() => prefs.setData('language', v)} className={cn('rounded-full border px-3 py-1 text-sm', prefs.data.language === v && 'bg-foreground text-background')}>
                                                                {t(l)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </fieldset>
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input type="checkbox" checked={prefs.data.emoji} onChange={(e) => prefs.setData('emoji', e.target.checked)} /> {t('Emoji are OK in marketing copy')}
                                                </label>
                                                <Button size="sm" type="submit" disabled={prefs.processing}>
                                                    {t(c.cta)}
                                                </Button>
                                            </form>
                                        )}

                                        {s.id === 'go_live' && (
                                            <div className="space-y-2">
                                                {!s.detail.ready && <p className="text-warning-fg text-sm">{t('Finish the required steps first: name, product, payments and shipping.')}</p>}
                                                <div className="flex flex-wrap gap-2">
                                                    <Button size="sm" disabled={!s.detail.ready || store.is_active} onClick={() => router.post(route('onboarding.go-live'), {}, { preserveScroll: true })}>
                                                        <Rocket /> {store.is_active ? t('Live') : t(c.cta)}
                                                    </Button>
                                                    {typeof s.detail.store_url === 'string' && (
                                                        <Button size="sm" variant="outline" asChild>
                                                            <a href={s.detail.store_url} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink /> {t('Preview store')}
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {!['identity', 'ai_preferences', 'go_live'].includes(s.id) && (
                                            <div className="flex flex-wrap gap-2">
                                                {s.href && (
                                                    <Button size="sm" variant={s.status === 'todo' ? 'default' : 'outline'} asChild>
                                                        <Link href={s.href}>{t(c.cta)}</Link>
                                                    </Button>
                                                )}
                                                {s.id === 'policies' && s.status === 'todo' && (
                                                    <Button size="sm" variant="outline" onClick={() => post('onboarding.complete', s.id)}>
                                                        <Check /> {t('I have published them')}
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                            {s.skippable && s.status === 'todo' && (
                                                <Button size="sm" variant="ghost" onClick={() => post('onboarding.skip', s.id)}>
                                                    <SkipForward /> {t('Skip for now')}
                                                </Button>
                                            )}
                                            {s.status !== 'todo' && !s.derived && s.id !== 'go_live' && (
                                                <Button size="sm" variant="ghost" onClick={() => post('onboarding.reopen', s.id)}>
                                                    <Undo2 /> {t('Reopen')}
                                                </Button>
                                            )}
                                            {s.derived && s.status === 'done' && (
                                                <p className="text-success-fg inline-flex items-center gap-1 text-xs">
                                                    <CircleDashed className="size-3" aria-hidden /> {t('Detected from your store')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </PageTemplate>
    );
}
