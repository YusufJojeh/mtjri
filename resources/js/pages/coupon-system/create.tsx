import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { usePermissions } from '@/hooks/usePermissions';
import { DiscountForm, type DiscountFormData } from '@/components/discounts/discount-form';

const EMPTY: DiscountFormData = {
    name: '',
    code: '',
    description: '',
    type: 'percentage',
    discount_amount: '',
    minimum_spend: '',
    maximum_spend: '',
    start_date: '',
    expiry_date: '',
    use_limit_per_coupon: '',
    use_limit_per_user: '',
    status: true,
    code_type: 'manual',
};

export default function CreateCoupon() {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();

    return (
        <PageTemplate
            title={t('Create discount')}
            url="/coupon-system/create"
            header={<></>}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Discounts'), href: route('coupon-system.index') },
                { title: t('Create discount') },
            ]}
        >
            <DiscountForm
                mode="create"
                initial={EMPTY}
                canSave={hasPermission('create-coupon-system')}
                backHref={route('coupon-system.index')}
                submit={(form) => {
                    // Same payload and endpoint as before; empty dates are sent as null.
                    form.transform((d) => ({ ...d, start_date: d.start_date || null, expiry_date: d.expiry_date || null }) as unknown as DiscountFormData);
                    form.post(route('store-coupons.store'), { preserveScroll: true });
                }}
            />
        </PageTemplate>
    );
}
