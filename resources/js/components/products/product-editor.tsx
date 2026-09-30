import { useEffect, useRef, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { AlertCircle, FileText, Images, Info, Layers, Loader2, Plus, Save, Sparkles, Tag, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { PageHeader, Panel } from '@/components/ds/layout';
import { AiBadge, AiProposal } from '@/components/ds/ai';
import { StatusBadge, ToneBadge } from '@/components/ds/status-badge';
import { ACTIVE_STATUS } from '@/lib/commerce/status';
import { htmlToText, textToHtml } from '@/lib/commerce/diff';
import { useAiAccess } from '@/hooks/use-ai-access';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import MediaPicker from '@/components/MediaPicker';
import { cn } from '@/lib/utils';
import { effectivePrice } from './product-bits';
import { clip, useAiField } from './use-ai-field';
import type { ComposeRequest } from '@/lib/commerce/ai';


export interface ProductFormData {
    name: string;
    sku: string;
    description: string;
    specifications: string;
    details: string;
    price: any;
    sale_price: any;
    stock: any;
    cover_image: string;
    images: string;
    category_id: string;
    tax_id: string;
    is_active: boolean;
    is_downloadable: boolean;
    downloadable_file: string;
}

export interface Variant {
    name: string;
    values: string[];
}
export interface CustomField {
    name: string;
    value: string;
}

export type ProductPayload = ProductFormData & { variants: Variant[]; custom_fields: CustomField[] };
export type VisitCallbacks = { onStart: () => void; onFinish: () => void; onSuccess: () => void; preserveScroll: true };

export function initialFormData(product?: any): ProductFormData {
    if (!product) {
        return {
            name: '',
            sku: '',
            description: '',
            specifications: '',
            details: '',
            price: '',
            sale_price: '',
            stock: 0,
            cover_image: '',
            images: '',
            category_id: '',
            tax_id: '',
            is_active: true,
            is_downloadable: false,
            downloadable_file: '',
        };
    }
    return {
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        specifications: product.specifications || '',
        details: product.details || '',
        price: product.price || '',
        sale_price: product.sale_price || '',
        stock: product.stock || 0,
        cover_image: product.cover_image || '',
        images: product.images || '',
        category_id: product.category_id ? String(product.category_id) : '',
        tax_id: product.tax_id ? String(product.tax_id) : '',
        is_active: product.is_active !== undefined ? product.is_active : true,
        is_downloadable: product.is_downloadable || false,
        downloadable_file: product.downloadable_file || '',
    };
}

interface ProductEditorProps {
    mode: 'create' | 'edit';
    product?: any;
    categories: Array<{ id: number; name: string }>;
    taxes: Array<{ id: number; name: string; rate: number | string }>;
    /** Performs the actual Inertia visit (unchanged routes/payload per page). */
    submit: (payload: ProductPayload, visit: VisitCallbacks) => void;
}

type AiFieldKey = 'description' | 'specifications' | 'details';

export function ProductEditor({ mode, product, categories, taxes, submit }: ProductEditorProps) {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const aiEnabled = useAiAccess();
    const errors = ((usePage().props as any).errors ?? {}) as Record<string, string>;

    const [formData, setFormData] = useState<ProductFormData>(() => initialFormData(product));
    const [customFields, setCustomFields] = useState<CustomField[]>(() =>
        product?.custom_fields && product.custom_fields.length > 0 ? product.custom_fields.map((f: CustomField) => ({ ...f })) : [{ name: '', value: '' }],
    );
    const [variants, setVariants] = useState<Variant[]>(() =>
        product?.variants && product.variants.length > 0
            ? product.variants.map((v: Variant) => ({ name: v.name ?? '', values: Array.isArray(v.values) && v.values.length ? [...v.values] : [''] }))
            : [{ name: '', values: [''] }],
    );
    const [processing, setProcessing] = useState(false);
    const [aiApplied, setAiApplied] = useState<Record<AiFieldKey, boolean>>({ description: false, specifications: false, details: false });
    const snapshot = useRef('');

    // Reset when a different product (or a newer saved version) arrives — not on
    // every props refresh, so validation errors never wipe unsaved edits.
    const productKey = product ? `${product.id}:${product.updated_at ?? ''}` : 'new';
    const firstKey = useRef(productKey);
    useEffect(() => {
        if (firstKey.current === productKey) return;
        firstKey.current = productKey;
        setFormData(initialFormData(product));
        snapshot.current = JSON.stringify([initialFormData(product), variants, customFields]);
        setAiApplied({ description: false, specifications: false, details: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productKey]);

    const serialized = JSON.stringify([formData, variants, customFields]);
    if (!snapshot.current) snapshot.current = serialized;
    const dirty = serialized !== snapshot.current;

    // Warn before leaving with unsaved changes.
    const dirtyRef = useRef(dirty);
    dirtyRef.current = dirty && !processing;
    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!dirtyRef.current) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        const off = router.on('before', (event) => {
            const visit = event.detail.visit;
            if (!dirtyRef.current || visit.method !== 'get') return;
            if (!window.confirm(t('You have unsaved changes. Leave without saving?'))) event.preventDefault();
        });
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            off();
        };
    }, [t]);

    /* ---- Field handlers (same semantics as before) ---- */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData((f) => ({ ...f, [name]: type === 'number' ? parseFloat(value) : value }));
    };
    const setField = <K extends keyof ProductFormData>(name: K, value: ProductFormData[K]) => setFormData((f) => ({ ...f, [name]: value }));

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (processing) return;
        const productData: ProductPayload = {
            ...formData,
            variants: variants.filter((v) => v.name.trim() !== ''),
            custom_fields: customFields.filter((f) => f.name.trim() !== ''),
        };
        submit(productData, {
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                snapshot.current = JSON.stringify([formData, variants, customFields]);
            },
        });
    };

    /* ---- Contextual AI ---- */
    const descAi = useAiField();
    const specAi = useAiField();
    const detailsAi = useAiField();
    const aiFor: Record<AiFieldKey, ReturnType<typeof useAiField>> = { description: descAi, specifications: specAi, details: detailsAi };

    const categoryName = categories.find((c) => String(c.id) === formData.category_id)?.name;
    const priceInfo = effectivePrice(Number.isFinite(Number(formData.price)) ? formData.price : 0, formData.sale_price);
    const facts = () => {
        const lines = [`Product: ${clip(formData.name, 120)}`];
        if (categoryName) lines.push(`Category: ${clip(categoryName, 60)}`);
        if (formData.price !== '' && Number.isFinite(Number(formData.price))) lines.push(`Price: ${fmt.money(priceInfo.onSale ? priceInfo.sale : priceInfo.price)}`);
        const opts = variants.filter((v) => v.name.trim()).map((v) => `${v.name}: ${v.values.filter(Boolean).join('/')}`);
        if (opts.length) lines.push(`Options: ${clip(opts.join('; '), 120)}`);
        return lines;
    };
    const plain = (k: AiFieldKey) => htmlToText(formData[k]);
    const IMPROVE_LIMIT: Record<AiFieldKey, number> = { description: 560, specifications: 520, details: 520 };

    const canImprove = (k: AiFieldKey) => {
        const len = plain(k).length;
        return len > 0 && len <= IMPROVE_LIMIT[k];
    };

    const buildRequest = (k: AiFieldKey): ComposeRequest | null => {
        if (!formData.name.trim()) return null;
        const improve = canImprove(k);
        let instructions: string;
        if (k === 'description') {
            instructions = improve
                ? 'Improve this product description for an online store: clearer and more persuasive, same facts, similar length. Separate paragraphs with a blank line.'
                : 'Write a product description for an online store in 2 short paragraphs separated by a blank line.';
        } else if (k === 'details') {
            instructions = improve
                ? 'Improve this "additional details" text for a product page: clearer and better organised, same facts, similar length.'
                : 'Write a short "additional details" section for a product page (care, use and what is included), 2 to 4 short lines.';
        } else {
            instructions = 'Tidy these product specifications into consistent "Label: value" lines, one per line. Keep every fact, add nothing.';
        }
        const extra: string[] = [];
        if (k !== 'specifications' && plain('specifications')) extra.push(`Specifications: ${clip(plain('specifications'), 300)}`);
        if (k !== 'description' && plain('description')) extra.push(`Description: ${clip(plain('description'), 300)}`);
        return {
            scope: 'product',
            label: clip(formData.name, 120),
            facts: [...facts(), ...extra].join('\n'),
            current: improve ? plain(k) : '',
            field: k,
            instructions,
        };
    };

    const acceptAi = (k: AiFieldKey, value: string) => {
        setField(k, textToHtml(value));
        setAiApplied((a) => ({ ...a, [k]: true }));
        aiFor[k].markApplied();
    };

    const aiButton = (k: AiFieldKey) => {
        if (!aiEnabled) return null;
        const ai = aiFor[k];
        const hasText = plain(k).length > 0;
        if (k === 'specifications' && !hasText) return null; // never invent specifications
        const improve = canImprove(k);
        const label = k === 'specifications' ? t('Tidy with AI') : improve ? t('Improve with AI') : t('Write with AI');
        return (
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-ai-fg hover:bg-ai-soft hover:text-ai-fg h-8"
                disabled={ai.busy || (k === 'specifications' && !improve)}
                onClick={() => ai.run(buildRequest(k))}
                title={k === 'specifications' && !improve ? t('Too long for AI tidying') : undefined}
            >
                {ai.busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {label}
            </Button>
        );
    };

    const aiArea = (k: AiFieldKey, label: string) => {
        if (!aiEnabled) return null;
        const ai = aiFor[k];
        const longRewrite = k !== 'specifications' && plain(k).length > IMPROVE_LIMIT[k];
        return (
            <AiProposal
                className="mt-3"
                field={label}
                current={plain(k)}
                state={ai.state}
                onAccept={(v) => acceptAi(k, v)}
                onReject={ai.reset}
                onRegenerate={() => ai.run(buildRequest(k))}
                acceptHint={
                    longRewrite
                        ? t('Your text is long, so this is a fresh draft rather than an edit. Accepting replaces the field — nothing is saved until you save the product')
                        : undefined
                }
            />
        );
    };

    const fieldError = (name: string) =>
        errors[name] ? (
            <p id={`${name}-error`} className="text-danger-fg mt-1.5 flex items-center gap-1 text-xs">
                <AlertCircle className="size-3.5" aria-hidden />
                {t(errors[name])}
            </p>
        ) : null;

    const errorCount = Object.keys(errors).length;
    const title = mode === 'create' ? t('Add product') : formData.name || product?.name || t('Edit product');
    const backHref = mode === 'edit' && product ? route('products.show', product.id) : route('products.index');

    const numVal = (v: any) => (typeof v === 'number' && Number.isNaN(v) ? '' : v);

    const saveLabel = mode === 'create' ? t('Save product') : t('Save changes');

    const saveButtons = (
        <>
            <Button type="button" variant="outline" size="sm" asChild className="h-9">
                <Link href={backHref}>{dirty ? t('Discard') : t('Cancel')}</Link>
            </Button>
            <Button type="button" size="sm" className="h-9" disabled={processing} onClick={() => handleSubmit()}>
                {processing ? <Loader2 className="animate-spin" /> : <Save />}
                {processing ? t('Saving…') : saveLabel}
            </Button>
        </>
    );

    return (
        <PageTemplate
            title={mode === 'create' ? t('Add product') : t('Edit product')}
            url={mode === 'create' ? '/products/create' : `/products/${product?.id}/edit`}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Products'), href: route('products.index') },
                ...(mode === 'edit' && product ? [{ title: product.name, href: route('products.show', product.id) }] : []),
                { title: mode === 'create' ? t('Add product') : t('Edit') },
            ]}
            header={
                <PageHeader
                    back={{ href: backHref, label: mode === 'edit' ? t('Product') : t('Products') }}
                    title={title}
                    meta={
                        <>
                            <StatusBadge meta={formData.is_active ? ACTIVE_STATUS.active : ACTIVE_STATUS.inactive} />
                            {dirty && <ToneBadge tone="warning">{t('Unsaved changes')}</ToneBadge>}
                        </>
                    }
                    actions={<div className="hidden items-center gap-2 md:flex">{saveButtons}</div>}
                />
            }
        >
            <form onSubmit={handleSubmit} noValidate>
                {errorCount > 0 && (
                    <div role="alert" className="bg-danger-soft text-danger-fg mb-5 flex items-start gap-2 rounded-xl border border-current/20 p-3 text-sm">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                        <div>
                            <p className="font-medium">{t('The product was not saved')}</p>
                            <p className="text-xs">{t('Fix the highlighted fields and save again.')}</p>
                        </div>
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    {/* Main content */}
                    <div className="min-w-0 space-y-5">
                        <Panel title={t('Product')} icon={<FileText />}>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">
                                        {t('Name')} <span className="text-danger-fg">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        className="mt-1.5"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder={t('e.g. Linen cushion cover')}
                                        aria-invalid={!!errors.name}
                                        aria-describedby={errors.name ? 'name-error' : undefined}
                                        required
                                    />
                                    {fieldError('name')}
                                </div>
                                <div>
                                    <div className="mb-1.5 flex min-h-8 flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="description-editor">{t('Description')}</Label>
                                            {aiApplied.description && <AiBadge>{t('AI-assisted · not saved yet')}</AiBadge>}
                                        </div>
                                        {aiButton('description')}
                                    </div>
                                    <div id="description-editor">
                                        <RichTextEditor
                                            key={`description-${product?.id ?? 'new'}`}
                                            value={formData.description}
                                            onChange={(value) => setField('description', value)}
                                            placeholder={t('Describe the product: what it is, who it is for and why it is worth buying')}
                                        />
                                    </div>
                                    {fieldError('description')}
                                    {aiArea('description', t('Description'))}
                                </div>
                            </div>
                        </Panel>

                        <Panel title={t('Media')} icon={<Images />} description={t('The cover image is shown in listings and at the top of the product page.')}>
                            <div className="space-y-4 [&_img]:rounded-md">
                                <div>
                                    <MediaPicker
                                        label={t('Cover image')}
                                        value={formData.cover_image}
                                        onChange={(value) => setField('cover_image', value)}
                                        placeholder={t('Select cover image...')}
                                    />
                                    {fieldError('cover_image')}
                                </div>
                                <div>
                                    <MediaPicker
                                        label={t('Additional images')}
                                        value={formData.images}
                                        onChange={(value) => setField('images', value)}
                                        multiple={true}
                                        placeholder={t('Select product images...')}
                                    />
                                    {fieldError('images')}
                                </div>
                            </div>
                        </Panel>

                        <Panel title={t('Specifications & details')} icon={<Tag />}>
                            <div className="space-y-5">
                                <div>
                                    <div className="mb-1.5 flex min-h-8 flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="specifications-editor">{t('Specifications')}</Label>
                                            {aiApplied.specifications && <AiBadge>{t('AI-assisted · not saved yet')}</AiBadge>}
                                        </div>
                                        {aiButton('specifications')}
                                    </div>
                                    <div id="specifications-editor">
                                        <RichTextEditor
                                            key={`specifications-${product?.id ?? 'new'}`}
                                            value={formData.specifications}
                                            onChange={(value) => setField('specifications', value)}
                                            placeholder={t('Material, dimensions, weight…')}
                                        />
                                    </div>
                                    {fieldError('specifications')}
                                    {aiArea('specifications', t('Specifications'))}
                                </div>
                                <div>
                                    <div className="mb-1.5 flex min-h-8 flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="details-editor">{t('Additional details')}</Label>
                                            {aiApplied.details && <AiBadge>{t('AI-assisted · not saved yet')}</AiBadge>}
                                        </div>
                                        {aiButton('details')}
                                    </div>
                                    <div id="details-editor">
                                        <RichTextEditor
                                            key={`details-${product?.id ?? 'new'}`}
                                            value={formData.details}
                                            onChange={(value) => setField('details', value)}
                                            placeholder={t('Care instructions, what is in the box…')}
                                        />
                                    </div>
                                    {fieldError('details')}
                                    {aiArea('details', t('Additional details'))}
                                </div>
                            </div>
                        </Panel>

                        <Panel
                            title={t('Variants')}
                            icon={<Layers />}
                            description={t('Options customers choose, such as size or color. Stock and price stay shared across options.')}
                            action={
                                <Button type="button" variant="outline" size="sm" onClick={() => setVariants([...variants, { name: '', values: [''] }])}>
                                    <Plus /> {t('Add option')}
                                </Button>
                            }
                        >
                            {variants.length === 0 ? (
                                <p className="text-muted-foreground text-sm">{t('No options. Add one if customers choose a size, color or similar.')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {variants.map((variant, index) => (
                                        <div key={index} className="bg-muted/30 space-y-3 rounded-lg border p-3">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    aria-label={t('Option name')}
                                                    placeholder={t('Variant name (e.g., Color, Size)')}
                                                    value={variant.name}
                                                    onChange={(e) => setVariants(variants.map((v, i) => (i === index ? { ...v, name: e.target.value } : v)))}
                                                    className="bg-background"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="shrink-0"
                                                    aria-label={t('Remove option')}
                                                    onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {variant.values.map((value, valueIndex) => (
                                                    <div key={valueIndex} className="bg-background flex h-9 items-center rounded-md border ps-2.5 pe-1">
                                                        <input
                                                            aria-label={t('Option value')}
                                                            placeholder={t('Variant value')}
                                                            value={value}
                                                            size={Math.max(6, value.length + 1)}
                                                            onChange={(e) =>
                                                                setVariants(
                                                                    variants.map((v, i) =>
                                                                        i === index ? { ...v, values: v.values.map((x, j) => (j === valueIndex ? e.target.value : x)) } : v,
                                                                    ),
                                                                )
                                                            }
                                                            className="w-auto max-w-40 bg-transparent text-sm outline-none"
                                                        />
                                                        {variant.values.length > 1 && (
                                                            <button
                                                                type="button"
                                                                aria-label={t('Remove value')}
                                                                className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded"
                                                                onClick={() =>
                                                                    setVariants(variants.map((v, i) => (i === index ? { ...v, values: v.values.filter((_, j) => j !== valueIndex) } : v)))
                                                                }
                                                            >
                                                                <X className="size-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-9"
                                                    onClick={() => setVariants(variants.map((v, i) => (i === index ? { ...v, values: [...v.values, ''] } : v)))}
                                                >
                                                    <Plus /> {t('Add value')}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Panel>

                        <Panel
                            title={t('Custom fields')}
                            description={t('Extra label/value pairs shown on the product page.')}
                            action={
                                <Button type="button" variant="outline" size="sm" onClick={() => setCustomFields([...customFields, { name: '', value: '' }])}>
                                    <Plus /> {t('Add Field')}
                                </Button>
                            }
                        >
                            {customFields.length === 0 ? (
                                <p className="text-muted-foreground text-sm">{t('No custom fields.')}</p>
                            ) : (
                                <div className="space-y-2">
                                    {customFields.map((field, index) => (
                                        <div key={index} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                                            <Input
                                                aria-label={t('Field name')}
                                                placeholder={t('Field name')}
                                                value={field.name}
                                                onChange={(e) => setCustomFields(customFields.map((f, i) => (i === index ? { ...f, name: e.target.value } : f)))}
                                            />
                                            <Input
                                                aria-label={t('Field value')}
                                                placeholder={t('Field value')}
                                                value={field.value}
                                                onChange={(e) => setCustomFields(customFields.map((f, i) => (i === index ? { ...f, value: e.target.value } : f)))}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label={t('Remove field')}
                                                onClick={() => setCustomFields(customFields.filter((_, i) => i !== index))}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Panel>
                    </div>

                    {/* Sidebar */}
                    <div className="min-w-0 space-y-5">
                        <Panel title={t('Status')}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <Label htmlFor="is_active">{t('Visible on storefront')}</Label>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        {formData.is_active ? t('Customers can find and buy this product.') : t('Saved as a draft; hidden from customers.')}
                                    </p>
                                </div>
                                <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setField('is_active', checked)} />
                            </div>
                        </Panel>

                        <Panel title={t('Pricing')}>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="price">
                                        {t('Price')} <span className="text-danger-fg">*</span>
                                    </Label>
                                    <Input
                                        id="price"
                                        name="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        inputMode="decimal"
                                        dir="ltr"
                                        className="mt-1.5 text-start"
                                        value={numVal(formData.price)}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        aria-invalid={!!errors.price}
                                        aria-describedby={errors.price ? 'price-error' : undefined}
                                    />
                                    {fieldError('price')}
                                </div>
                                <div>
                                    <Label htmlFor="sale_price">{t('Sale price')}</Label>
                                    <Input
                                        id="sale_price"
                                        name="sale_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        inputMode="decimal"
                                        dir="ltr"
                                        className="mt-1.5 text-start"
                                        value={numVal(formData.sale_price)}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        aria-invalid={!!errors.sale_price}
                                    />
                                    {fieldError('sale_price')}
                                    <p className="text-muted-foreground mt-1.5 text-xs">
                                        {priceInfo.onSale && priceInfo.price > 0
                                            ? t('Customers pay {{price}} ({{n}}% off).', {
                                                  price: fmt.money(priceInfo.sale),
                                                  n: fmt.number(Math.round(((priceInfo.price - (priceInfo.sale ?? 0)) / priceInfo.price) * 100)),
                                              })
                                            : t('Optional. Applies only when lower than the price.')}
                                    </p>
                                </div>
                                <div>
                                    <Label htmlFor="tax_id">{t('Tax')}</Label>
                                    <Select value={formData.tax_id} onValueChange={(value) => setField('tax_id', value)}>
                                        <SelectTrigger id="tax_id" className="mt-1.5 w-full">
                                            <SelectValue placeholder={t('Select tax class')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {taxes?.map((tax) => (
                                                <SelectItem key={tax.id} value={String(tax.id)}>
                                                    {tax.name} ({tax.rate}%)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldError('tax_id')}
                                </div>
                            </div>
                        </Panel>

                        <Panel title={t('Inventory')}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
                                    <div>
                                        <Label htmlFor="stock">
                                            {t('Stock')} <span className="text-danger-fg">*</span>
                                        </Label>
                                        <Input
                                            id="stock"
                                            name="stock"
                                            type="number"
                                            min="0"
                                            step="1"
                                            inputMode="numeric"
                                            dir="ltr"
                                            className="mt-1.5 text-start"
                                            value={numVal(formData.stock)}
                                            onChange={handleChange}
                                            placeholder="0"
                                            aria-invalid={!!errors.stock}
                                            aria-describedby={errors.stock ? 'stock-error' : undefined}
                                        />
                                        {fieldError('stock')}
                                    </div>
                                    <div>
                                        <Label htmlFor="sku">{t('SKU')}</Label>
                                        <Input
                                            id="sku"
                                            name="sku"
                                            dir="ltr"
                                            className="mt-1.5 text-start"
                                            value={formData.sku}
                                            onChange={handleChange}
                                            placeholder={t('Product SKU')}
                                            aria-invalid={!!errors.sku}
                                        />
                                        {fieldError('sku')}
                                    </div>
                                </div>
                                <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                                    <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                                    {t('Stock is shared across all options of this product.')}
                                </p>
                                <div className="flex items-start justify-between gap-3 border-t pt-4">
                                    <div>
                                        <Label htmlFor="is_downloadable">{t('Digital product')}</Label>
                                        <p className="text-muted-foreground mt-0.5 text-xs">{t('Customers receive a file to download.')}</p>
                                    </div>
                                    <Switch id="is_downloadable" checked={formData.is_downloadable} onCheckedChange={(checked) => setField('is_downloadable', checked)} />
                                </div>
                                {(formData.is_downloadable || formData.downloadable_file) && (
                                    <div>
                                        <MediaPicker
                                            label={t('Downloadable File')}
                                            value={formData.downloadable_file}
                                            onChange={(value) => setField('downloadable_file', value)}
                                            placeholder={t('Select downloadable file...')}
                                        />
                                        {fieldError('downloadable_file')}
                                    </div>
                                )}
                            </div>
                        </Panel>

                        <Panel title={t('Organization')}>
                            <Label htmlFor="category_id">{t('Category')}</Label>
                            <Select value={formData.category_id} onValueChange={(value) => setField('category_id', value)}>
                                <SelectTrigger id="category_id" className="mt-1.5 w-full" aria-invalid={!!errors.category_id}>
                                    <SelectValue placeholder={t('Select category')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories?.map((category) => (
                                        <SelectItem key={category.id} value={String(category.id)}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fieldError('category_id')}
                            {categories.length === 0 && <p className="text-muted-foreground mt-1.5 text-xs">{t('No active categories yet.')}</p>}
                        </Panel>
                    </div>
                </div>

                {/* Save bar: fixed above the phone tab bar; sticky at the bottom from md up */}
                <div className="h-20 md:hidden" aria-hidden />
                <div
                    className={cn(
                        'bg-background/95 supports-[backdrop-filter]:bg-background/85 z-30 flex items-center justify-between gap-3 border-t px-4 py-2.5 backdrop-blur',
                        'fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] md:sticky md:bottom-0 md:mt-5 md:rounded-xl md:border md:shadow-card',
                        !dirty && 'md:hidden',
                    )}
                >
                    <p className="text-muted-foreground min-w-0 truncate text-xs" aria-live="polite">
                        {processing ? t('Saving…') : dirty ? t('Unsaved changes') : mode === 'create' ? t('New product') : t('All changes saved')}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">{saveButtons}</div>
                </div>
            </form>
        </PageTemplate>
    );
}
