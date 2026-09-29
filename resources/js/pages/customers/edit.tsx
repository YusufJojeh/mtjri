import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { PageHeader } from '@/components/ds/layout';
import { CustomerForm, type CustomerFormData } from '@/components/customers/customer-form';
import { usePermissions } from '@/hooks/usePermissions';

interface AddressRow {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
}

interface EditProps {
    customer: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        phone: string | null;
        date_of_birth: string | null;
        gender: string | null;
        notes: string | null;
        avatar: string | null;
        is_active?: boolean;
        preferred_language: string | null;
        customer_group: string | null;
        email_marketing?: boolean;
        sms_notifications?: boolean;
        order_updates?: boolean;
    };
    billingAddress: AddressRow | null;
    shippingAddress: AddressRow | null;
    sameAsBilling: boolean;
    [key: string]: unknown;
}

const toAddress = (a: AddressRow | null) => ({
    address: a?.address || '',
    city: a?.city || '',
    state: a?.state || '',
    postal_code: a?.postal_code || '',
    country: a?.country || 'us',
});

export default function EditCustomer() {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const { customer, billingAddress, shippingAddress, sameAsBilling } = usePage<EditProps>().props;
    const name = `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim();

    const initial: CustomerFormData = {
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        // <input type="date"> needs YYYY-MM-DD; the model serialises dates as ISO strings.
        date_of_birth: customer.date_of_birth ? String(customer.date_of_birth).slice(0, 10) : '',
        gender: customer.gender || '',
        notes: customer.notes || '',
        is_active: customer.is_active !== undefined ? !!customer.is_active : true,
        preferred_language: customer.preferred_language || 'en',
        customer_group: customer.customer_group || 'regular',
        email_marketing: customer.email_marketing !== undefined ? !!customer.email_marketing : true,
        sms_notifications: customer.sms_notifications !== undefined ? !!customer.sms_notifications : false,
        order_updates: customer.order_updates !== undefined ? !!customer.order_updates : true,
        billing_address: toAddress(billingAddress),
        shipping_address: toAddress(shippingAddress),
        same_as_billing: !!sameAsBilling,
        avatar: customer.avatar || '',
    };

    return (
        <PageTemplate
            title={t('Edit customer')}
            url={route('customers.edit', customer.id)}
            width="narrow"
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Customers'), href: route('customers.index') },
                { title: name || t('Customer'), href: route('customers.show', customer.id) },
                { title: t('Edit') },
            ]}
            header={
                <PageHeader
                    back={{ href: route('customers.show', customer.id), label: name || t('Customer') }}
                    title={t('Edit customer')}
                    description={name || undefined}
                />
            }
        >
            <div className="mx-auto max-w-3xl">
                <CustomerForm
                    initial={initial}
                    method="put"
                    onSubmitRoute={route('customers.update', customer.id)}
                    cancelHref={route('customers.show', customer.id)}
                    submitLabel={t('Save changes')}
                    canSubmit={hasPermission('edit-customers')}
                />
            </div>
        </PageTemplate>
    );
}
