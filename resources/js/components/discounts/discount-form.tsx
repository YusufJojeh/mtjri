import { useForm, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Eye, Percent, Shuffle, Banknote } from 'lucide-react';
import { PageHeader, Panel, SectionLabel } from '@/components/ds/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { cn } from '@/lib/utils';
import { DiscountStateBadge } from './discount-bits';
import { daysUntil, deriveState, num, previewSentence } from './discount-utils';

export type DiscountFormData = {
    name: string;
    code: string;
    description: string;
    type: string;
    discount_amount: string | number;
    minimum_spend: string | number;
    maximum_spend: string | number;
    start_date: string;
    expiry_date: string;
    use_limit_per_coupon: string | number;
    use_limit_per_user: string | number;
    status: boolean;
    code_type: string;
};

interface Props {
    mode: 'create' | 'edit';
    initial: DiscountFormData;
    /** Submits with the same payload and route as the legacy form. */
    submit: (form: ReturnType<typeof useForm<DiscountFormData>>) => void;
    canSave: boolean;
    backHref: string;
}

function Field({ id, label, hint, error, children, className }: { id: string; label: string; hint?: React.ReactNode; error?: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label htmlFor={id}>{label}</Label>
            {children}
            {error ? (
                <p id={`${id}-error`} className="text-danger-fg text-xs">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${id}-hint`} className="text-muted-foreground text-xs">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

export function DiscountForm({ mode, initial, submit, canSave, backHref }: Props) {
    const { t } = useTranslation();
    const f = useCommerceFormat();
    const form = useForm<DiscountFormData>(initial);
    const { data, setData, errors, processing } = form;

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSave || processing) return;
        submit(form);
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 10; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
        setData('code', result);
    };

    const input = (name: keyof DiscountFormData) => ({
        id: name,
        name,
        value: data[name] as string | number,
        'aria-invalid': errors[name] ? true : undefined,
        'aria-describedby': errors[name] ? `${name}-error` : undefined,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setData(name, e.target.value as never),
    });

    const amount = num(data.discount_amount);
    const pctTooHigh = data.type === 'percentage' && amount !== null && amount > 100;
    const noDates = !data.start_date || !data.expiry_date;
    const endBeforeStart = data.start_date && data.expiry_date && data.expiry_date < data.start_date;
    const previewState = deriveState({ status: data.status, start_date: data.start_date || null, expiry_date: data.expiry_date || null });
    const title = mode === 'create' ? t('Create discount') : t('Edit discount');
    const saveLabel = processing ? t('Saving…') : mode === 'create' ? t('Save discount') : t('Save changes');

    const saveButton = (cls?: string) =>
        canSave ? (
            <Button type="submit" form="discount-form" size="sm" className={cn('h-9', cls)} disabled={processing}>
                {saveLabel}
            </Button>
        ) : null;

    const typeOption = (value: 'percentage' | 'flat', label: string, desc: string, Icon: typeof Percent) => (
        <label
            className={cn(
                'has-[:focus-visible]:ring-ring/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-[3px]',
                data.type === value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
            )}
        >
            <input type="radio" name="type" value={value} checked={data.type === value} onChange={() => setData('type', value)} className="accent-primary mt-1 size-4" />
            <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Icon className="text-muted-foreground size-4" aria-hidden />
                    {label}
                </span>
                <span className="text-muted-foreground block text-xs">{desc}</span>
            </span>
        </label>
    );

    return (
        <div className="space-y-5">
            <PageHeader
                back={{ href: backHref, label: t('Discounts') }}
                title={title}
                actions={
                    <>
                        <Button variant="outline" size="sm" className="h-9" asChild>
                            <Link href={backHref}>{t('Cancel')}</Link>
                        </Button>
                        {saveButton()}
                    </>
                }
            />

            <form id="discount-form" onSubmit={onSubmit} noValidate className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                <div className="min-w-0 space-y-5">
                    <Panel title={t('Details')}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field id="name" label={t('Name')} hint={t('Only you see this name.')} error={errors.name}>
                                <Input {...input('name')} placeholder={t('e.g. Summer sale')} required />
                            </Field>
                            <Field id="code" label={t('Code')} hint={t('Customers type this at checkout.')} error={errors.code}>
                                <div className="flex gap-2">
                                    <Input
                                        {...input('code')}
                                        dir="ltr"
                                        className="font-mono uppercase"
                                        placeholder="SAVE20"
                                        autoComplete="off"
                                        onChange={(e) => setData('code', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                                        required
                                    />
                                    <Button type="button" variant="outline" className="h-9 shrink-0" onClick={generateCode}>
                                        <Shuffle className="size-4" />
                                        {t('Generate')}
                                    </Button>
                                </div>
                            </Field>
                            <Field id="description" label={t('Internal note')} hint={t('Optional. Why this discount exists.')} error={errors.description} className="sm:col-span-2">
                                <Textarea {...input('description')} rows={2} />
                            </Field>
                        </div>
                    </Panel>

                    <Panel title={t('Value')}>
                        <fieldset className="space-y-4">
                            <legend className="sr-only">{t('Discount type')}</legend>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {typeOption('percentage', t('Percentage'), t('e.g. 15% off the order'), Percent)}
                                {typeOption('flat', t('Fixed amount'), t('e.g. {{amount}} off the order', { amount: f.money(20) }), Banknote)}
                            </div>
                            {errors.type && <p className="text-danger-fg text-xs">{errors.type}</p>}
                            <Field
                                id="discount_amount"
                                label={data.type === 'percentage' ? t('Percentage off') : t('Amount off ({{currency}})', { currency: f.currencyCode })}
                                error={errors.discount_amount}
                                className="sm:max-w-xs"
                            >
                                <div className="relative">
                                    <Input
                                        {...input('discount_amount')}
                                        type="number"
                                        inputMode="decimal"
                                        min={0}
                                        step={data.type === 'percentage' ? '1' : '0.01'}
                                        dir="ltr"
                                        className="pe-12 text-start"
                                        placeholder={data.type === 'percentage' ? '15' : '20.00'}
                                        required
                                    />
                                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm">
                                        {data.type === 'percentage' ? '%' : f.currencyCode}
                                    </span>
                                </div>
                            </Field>
                            {pctTooHigh && (
                                <p className="text-warning-fg flex items-center gap-1 text-xs">
                                    <AlertTriangle className="size-3" aria-hidden />
                                    {t('More than 100% would make orders free.')}
                                </p>
                            )}
                        </fieldset>
                    </Panel>

                    <Panel title={t('Eligibility & limits')}>
                        <div className="space-y-4">
                            <SectionLabel>{t('Order conditions')}</SectionLabel>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field id="minimum_spend" label={t('Minimum order')} hint={t('Leave empty for no minimum.')} error={errors.minimum_spend}>
                                    <Input {...input('minimum_spend')} type="number" inputMode="decimal" min={0} step="0.01" dir="ltr" className="text-start" placeholder="0.00" />
                                </Field>
                                <Field id="maximum_spend" label={t('Maximum discount')} hint={t('Caps the discount at checkout. Leave empty for no cap.')} error={errors.maximum_spend}>
                                    <Input {...input('maximum_spend')} type="number" inputMode="decimal" min={0} step="0.01" dir="ltr" className="text-start" placeholder="0.00" />
                                </Field>
                            </div>
                            <SectionLabel className="pt-2">{t('Usage limits')}</SectionLabel>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field id="use_limit_per_coupon" label={t('Total uses allowed')} hint={t('Leave empty for unlimited.')} error={errors.use_limit_per_coupon}>
                                    <Input {...input('use_limit_per_coupon')} type="number" inputMode="numeric" min={1} step="1" dir="ltr" className="text-start" placeholder={t('Unlimited')} />
                                </Field>
                                <Field id="use_limit_per_user" label={t('Uses per customer')} hint={t('Leave empty for unlimited.')} error={errors.use_limit_per_user}>
                                    <Input {...input('use_limit_per_user')} type="number" inputMode="numeric" min={1} step="1" dir="ltr" className="text-start" placeholder={t('Unlimited')} />
                                </Field>
                            </div>
                        </div>
                    </Panel>

                    <Panel title={t('Schedule')}>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field id="start_date" label={t('Starts')} error={errors.start_date}>
                                <Input {...input('start_date')} type="date" />
                            </Field>
                            <Field id="expiry_date" label={t('Ends')} error={errors.expiry_date}>
                                <Input {...input('expiry_date')} type="date" min={data.start_date || undefined} />
                            </Field>
                        </div>
                        {(noDates || endBeforeStart) && (
                            <p className="text-warning-fg mt-3 flex items-start gap-1.5 text-xs">
                                <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden />
                                {endBeforeStart ? t('The end date is before the start date.') : t('Checkout only accepts codes that have both a start and an end date.')}
                            </p>
                        )}
                    </Panel>

                    <Panel title={t('Status')}>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <Label htmlFor="status">{data.status ? t('Active') : t('Paused')}</Label>
                                <p className="text-muted-foreground text-xs">{t('Paused codes are kept but can’t be used at checkout.')}</p>
                            </div>
                            <Switch id="status" checked={data.status} onCheckedChange={(v) => setData('status', v)} />
                        </div>
                    </Panel>
                </div>

                <aside className="lg:sticky lg:top-20">
                    <Panel title={t('Preview')} icon={<Eye />} description={t('Updates as you type')}>
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <code dir="ltr" className="bg-muted rounded-md border px-2 py-1 font-mono text-sm font-semibold tracking-wide">
                                    {data.code || 'CODE'}
                                </code>
                                <DiscountStateBadge state={previewState} daysLeft={previewState === 'active' ? daysUntil(data.expiry_date) : null} />
                            </div>
                            <p className="text-sm leading-6" aria-live="polite">
                                {previewSentence(data, f, t)}
                            </p>
                            {data.name && <p className="text-muted-foreground border-t pt-3 text-xs">{data.name}</p>}
                            {saveButton('w-full')}
                        </div>
                    </Panel>
                </aside>
            </form>
        </div>
    );
}
