import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { usePermissions } from '@/hooks/usePermissions';
import { DiscountForm, type DiscountFormData } from '@/components/discounts/discount-form';
import { dayOnly, type Discount } from '@/components/discounts/discount-utils';

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export default function EditCoupon() {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const { coupon } = usePage().props as unknown as { coupon: Discount };

    const initial: DiscountFormData = {
        name: coupon.name || '',
        code: coupon.code || '',
        description: coupon.description || '',
        type: coupon.type || 'percentage',
        discount_amount: str(coupon.discount_amount),
        minimum_spend: str(coupon.minimum_spend),
        maximum_spend: str(coupon.maximum_spend),
        start_date: dayOnly(coupon.start_date),
        expiry_date: dayOnly(coupon.expiry_date),
        use_limit_per_coupon: str(coupon.use_limit_per_coupon),
        use_limit_per_user: str(coupon.use_limit_per_user),
        status: coupon.status !== undefined ? Boolean(coupon.status) : true,
        code_type: coupon.code_type || 'manual',
    };

    return (
        <PageTemplate
            title={t('Edit discount')}
            url="/coupon-system/edit"
            header={<></>}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Discounts'), href: route('coupon-system.index') },
                { title: coupon.name || t('Edit discount') },
            ]}
        >
            <DiscountForm
                mode="edit"
                initial={initial}
                canSave={hasPermission('edit-coupon-system')}
                backHref={route('store-coupons.show', coupon.id)}
                submit={(form) => {
                    form.transform((d) => ({ ...d, start_date: d.start_date || null, expiry_date: d.expiry_date || null }) as unknown as DiscountFormData);
                    form.put(route('store-coupons.update', coupon.id), { preserveScroll: true });
                }}
            />
        </PageTemplate>
    );
}
