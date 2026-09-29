import { FormEventHandler } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Panel } from '@/components/ds/layout';
import MediaPicker from '@/components/MediaPicker';
import { cn } from '@/lib/utils';

type AddressData = {
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
};

export type CustomerFormData = {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    gender: string;
    notes: string;
    is_active: boolean;
    preferred_language: string;
    customer_group: string;
    email_marketing: boolean;
    sms_notifications: boolean;
    order_updates: boolean;
    billing_address: AddressData;
    shipping_address: AddressData;
    same_as_billing: boolean;
    avatar: string;
};

const selectCls =
    'border-input bg-background focus-visible:ring-ring/40 h-9 w-full rounded-md border px-2.5 text-sm outline-none focus-visible:ring-[3px] disabled:opacity-60';


function Field({ id, label, error, hint, children, className }: { id?: string; label: string; error?: string; hint?: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('space-y-1.5', className)}>
            <Label htmlFor={id}>{label}</Label>
            {children}
            {hint && !error && <p className="text-muted-foreground text-xs">{hint}</p>}
            {error && (
                <p className="text-danger-fg text-xs" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}

function ToggleRow({ id, label, description, checked, onChange }: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
                <Label htmlFor={id}>{label}</Label>
                <p className="text-muted-foreground text-xs">{description}</p>
            </div>
            <Switch id={id} checked={checked} onCheckedChange={onChange} />
        </div>
    );
}

/**
 * Shared create/edit customer form. Field names and the submitted payload match
 * the original pages exactly (CustomerRequest validation is unchanged).
 */
export function CustomerForm({
    initial,
    submitLabel,
    onSubmitRoute,
    method,
    cancelHref,
    canSubmit,
}: {
    initial: CustomerFormData;
    submitLabel: string;
    onSubmitRoute: string;
    method: 'post' | 'put';
    cancelHref: string;
    canSubmit: boolean;
}) {
    const { t } = useTranslation();
    const form = useForm<CustomerFormData>(initial);
    const { data, setData, errors, processing } = form;
    const err = errors as Record<string, string | undefined>;

    const setAddress = (type: 'billing_address' | 'shipping_address', field: keyof AddressData, value: string) => {
        setData(type, { ...data[type], [field]: value });
    };

    const toggleSameAsBilling = (checked: boolean) => {
        form.setData((prev) => ({
            ...prev,
            same_as_billing: checked,
            shipping_address: checked ? { ...prev.billing_address } : prev.shipping_address,
        }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (method === 'post') form.post(onSubmitRoute, { preserveScroll: true });
        else form.put(onSubmitRoute, { preserveScroll: true });
    };

    const errorCount = Object.keys(errors).length;
    const COUNTRIES = [
        { value: 'us', label: t('United States') },
        { value: 'ca', label: t('Canada') },
        { value: 'uk', label: t('United Kingdom') },
        { value: 'au', label: t('Australia') },
    ];

    const addressFields = (type: 'billing_address' | 'shipping_address', disabled = false) => {
        const a = data[type];
        const p = type === 'billing_address' ? 'billing' : 'shipping';
        return (
            <div className="grid gap-4 sm:grid-cols-2">
                <Field id={`${p}_address`} label={t('Street address')} error={err[`${type}.address`]} className="sm:col-span-2">
                    <Input id={`${p}_address`} value={a.address} onChange={(e) => setAddress(type, 'address', e.target.value)} disabled={disabled} autoComplete="street-address" />
                </Field>
                <Field id={`${p}_city`} label={t('City')} error={err[`${type}.city`]}>
                    <Input id={`${p}_city`} value={a.city} onChange={(e) => setAddress(type, 'city', e.target.value)} disabled={disabled} />
                </Field>
                <Field id={`${p}_state`} label={t('State / Province')} error={err[`${type}.state`]}>
                    <Input id={`${p}_state`} value={a.state} onChange={(e) => setAddress(type, 'state', e.target.value)} disabled={disabled} />
                </Field>
                <Field id={`${p}_postal`} label={t('Postal code')} error={err[`${type}.postal_code`]}>
                    <Input id={`${p}_postal`} dir="ltr" value={a.postal_code} onChange={(e) => setAddress(type, 'postal_code', e.target.value)} disabled={disabled} />
                </Field>
                <Field id={`${p}_country`} label={t('Country')} error={err[`${type}.country`]}>
                    <select id={`${p}_country`} className={selectCls} value={a.country} onChange={(e) => setAddress(type, 'country', e.target.value)} disabled={disabled}>
                        {!COUNTRIES.some((c) => c.value === a.country) && a.country && <option value={a.country}>{a.country}</option>}
                        {COUNTRIES.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>
        );
    };

    return (
        <form onSubmit={submit} className="space-y-4" noValidate>
            {errorCount > 0 && (
                <div role="alert" className="bg-danger-soft text-danger-fg rounded-lg px-3 py-2.5 text-sm">
                    {t('Please review the highlighted fields.')}
                </div>
            )}

            <Panel title={t('Contact')} description={t('Name and how to reach this customer.')}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="first_name" label={t('First name')} error={errors.first_name}>
                        <Input id="first_name" value={data.first_name} onChange={(e) => setData('first_name', e.target.value)} required aria-invalid={!!errors.first_name} autoComplete="given-name" />
                    </Field>
                    <Field id="last_name" label={t('Last name')} error={errors.last_name}>
                        <Input id="last_name" value={data.last_name} onChange={(e) => setData('last_name', e.target.value)} required aria-invalid={!!errors.last_name} autoComplete="family-name" />
                    </Field>
                    <Field id="email" label={t('Email')} error={errors.email}>
                        <Input id="email" type="email" dir="ltr" value={data.email} onChange={(e) => setData('email', e.target.value)} required aria-invalid={!!errors.email} autoComplete="email" />
                    </Field>
                    <Field id="phone" label={t('Phone')} error={errors.phone}>
                        <Input id="phone" type="tel" dir="ltr" value={data.phone} onChange={(e) => setData('phone', e.target.value)} aria-invalid={!!errors.phone} autoComplete="tel" />
                    </Field>
                </div>
            </Panel>

            <Panel title={t('Profile')} description={t('Optional details used for personalisation.')}>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <MediaPicker label={t('Profile picture')} value={data.avatar} onChange={(v: string) => setData('avatar', v)} placeholder={t('Select profile picture...')} />
                    </div>
                    <Field id="date_of_birth" label={t('Date of birth')} error={errors.date_of_birth}>
                        <Input id="date_of_birth" type="date" value={data.date_of_birth} onChange={(e) => setData('date_of_birth', e.target.value)} />
                    </Field>
                    <Field id="gender" label={t('Gender')} error={errors.gender}>
                        <select id="gender" className={selectCls} value={data.gender} onChange={(e) => setData('gender', e.target.value)}>
                            <option value="">{t('Not specified')}</option>
                            <option value="male">{t('Male')}</option>
                            <option value="female">{t('Female')}</option>
                            <option value="other">{t('Other')}</option>
                            <option value="prefer_not_to_say">{t('Prefer not to say')}</option>
                        </select>
                    </Field>
                    <Field id="customer_group" label={t('Customer group')} error={errors.customer_group}>
                        <select id="customer_group" className={selectCls} value={data.customer_group} onChange={(e) => setData('customer_group', e.target.value)}>
                            {!['regular', 'vip', 'wholesale'].includes(data.customer_group) && data.customer_group && (
                                <option value={data.customer_group}>{data.customer_group}</option>
                            )}
                            <option value="regular">{t('Regular Customer')}</option>
                            <option value="vip">{t('VIP Customer')}</option>
                            <option value="wholesale">{t('Wholesale Customer')}</option>
                        </select>
                    </Field>
                    <Field id="preferred_language" label={t('Preferred language')} error={errors.preferred_language}>
                        <select id="preferred_language" className={selectCls} value={data.preferred_language} onChange={(e) => setData('preferred_language', e.target.value)}>
                            {!['en', 'ar', 'es', 'fr', 'de'].includes(data.preferred_language) && data.preferred_language && (
                                <option value={data.preferred_language}>{data.preferred_language}</option>
                            )}
                            <option value="ar">{t('Arabic')}</option>
                            <option value="en">{t('English')}</option>
                            <option value="es">{t('Spanish')}</option>
                            <option value="fr">{t('French')}</option>
                            <option value="de">{t('German')}</option>
                        </select>
                    </Field>
                    <Field id="notes" label={t('Notes')} error={errors.notes} className="sm:col-span-2">
                        <Textarea id="notes" rows={3} value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder={t('Internal notes, visible to your team only')} />
                    </Field>
                </div>
            </Panel>

            <Panel title={t('Billing address')}>{addressFields('billing_address')}</Panel>

            <Panel
                title={t('Shipping address')}
                action={
                    <label htmlFor="same_as_billing" className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                        <Switch id="same_as_billing" checked={data.same_as_billing} onCheckedChange={toggleSameAsBilling} />
                        {t('Same as billing')}
                    </label>
                }
            >
                {data.same_as_billing ? <p className="text-muted-foreground text-sm">{t('The billing address will be used for shipping.')}</p> : addressFields('shipping_address')}
            </Panel>

            <Panel title={t('Status and communication')}>
                <div className="divide-y">
                    <ToggleRow
                        id="is_active"
                        label={t('Active account')}
                        description={t('Inactive customers cannot sign in to your storefront.')}
                        checked={data.is_active}
                        onChange={(v) => setData('is_active', v)}
                    />
                    <ToggleRow
                        id="email_marketing"
                        label={t('Email marketing')}
                        description={t('Customer agreed to receive promotional emails.')}
                        checked={data.email_marketing}
                        onChange={(v) => setData('email_marketing', v)}
                    />
                    <ToggleRow
                        id="sms_notifications"
                        label={t('SMS notifications')}
                        description={t('Customer agreed to receive SMS messages.')}
                        checked={data.sms_notifications}
                        onChange={(v) => setData('sms_notifications', v)}
                    />
                    <ToggleRow
                        id="order_updates"
                        label={t('Order updates')}
                        description={t('Send order status updates to this customer.')}
                        checked={data.order_updates}
                        onChange={(v) => setData('order_updates', v)}
                    />
                </div>
            </Panel>

            <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-14 z-10 -mx-4 flex items-center justify-end gap-2 border-t px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-xl md:border">
                <Button variant="outline" asChild>
                    <Link href={cancelHref}>{t('Cancel')}</Link>
                </Button>
                {canSubmit && (
                    <Button type="submit" disabled={processing}>
                        {processing && <Loader2 className="animate-spin" aria-hidden />}
                        {submitLabel}
                    </Button>
                )}
            </div>
        </form>
    );
}
