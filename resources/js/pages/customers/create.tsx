import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { PageHeader } from '@/components/ds/layout';
import { CustomerForm, type CustomerFormData } from '@/components/customers/customer-form';
import { usePermissions } from '@/hooks/usePermissions';

const emptyAddress = { address: '', city: '', state: '', postal_code: '', country: 'us' };

export default function CreateCustomer() {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();

    const initial: CustomerFormData = {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        notes: '',
        is_active: true,
        preferred_language: 'en',
        customer_group: 'regular',
        email_marketing: true,
        sms_notifications: false,
        order_updates: true,
        billing_address: { ...emptyAddress },
        shipping_address: { ...emptyAddress },
        same_as_billing: false,
        avatar: '',
    };

    return (
        <PageTemplate
            title={t('Add customer')}
            url={route('customers.create')}
            width="narrow"
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Customers'), href: route('customers.index') },
                { title: t('Add customer') },
            ]}
            header={<PageHeader back={{ href: route('customers.index'), label: t('Customers') }} title={t('Add customer')} />}
        >
            <div className="mx-auto max-w-3xl">
                <CustomerForm
                    initial={initial}
                    method="post"
                    onSubmitRoute={route('customers.store')}
                    cancelHref={route('customers.index')}
                    submitLabel={t('Save customer')}
                    canSubmit={hasPermission('create-customers')}
                />
            </div>
        </PageTemplate>
    );
}
