import { router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { EmptyState, Panel } from '@/components/ds/layout';
import { Pager, SegmentedTabs, type PageMeta } from '@/components/ds/data-table';
import { Button } from '@/components/ui/button';
import { NotificationRow, openNotification, type MerchantNotificationView } from '@/components/tijraa/notifications';

interface PageProps {
    filter: string;
    notifications: PageMeta & { data: MerchantNotificationView[] };
    unread: number;
}

const FILTERS = ['all', 'unread', 'orders', 'inventory', 'ai', 'knowledge', 'discounts', 'system'];
const LABELS: Record<string, string> = { all: 'All', unread: 'Unread', orders: 'Orders', inventory: 'Inventory', ai: 'AI', knowledge: 'Knowledge', discounts: 'Discounts', system: 'System' };

export default function NotificationsPage() {
    const { t } = useTranslation();
    const { filter, notifications, unread } = usePage().props as unknown as PageProps;
    const go = (params: Record<string, string | number>) => router.get(route('notifications.index'), { filter, ...params }, { preserveScroll: true });

    return (
        <PageTemplate
            title={t('Notifications')}
            url="/notifications"
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Notifications') }]}
            actions={unread > 0 ? [{ label: t('Mark all read'), icon: <CheckCheck />, onClick: () => router.post(route('notifications.read-all'), {}, { preserveScroll: true }) }] : []}
            width="narrow"
        >
            <div className="space-y-4">
                <SegmentedTabs
                    segments={FILTERS.map((f) => ({ value: f, label: t(LABELS[f]), count: f === 'unread' ? unread : undefined }))}
                    value={filter}
                    onChange={(v) => go({ filter: v })}
                    label={t('Filter notifications')}
                />
                <Panel flush as="div" className="overflow-hidden">
                    {notifications.data.length === 0 ? (
                        <EmptyState icon={<Bell />} title={t('No notifications')} description={t('New orders, stock alerts, AI proposals and knowledge updates appear here.')} />
                    ) : (
                        <ul className="divide-y">
                            {notifications.data.map((n) => (
                                <li key={n.id}>
                                    <NotificationRow n={n} onOpen={openNotification} />
                                </li>
                            ))}
                        </ul>
                    )}
                    <Pager meta={notifications} onPage={(p) => go({ page: p })} />
                </Panel>
                {unread > 0 && filter !== 'unread' && (
                    <Button variant="link" size="sm" onClick={() => go({ filter: 'unread' })}>
                        {t('Show only unread')}
                    </Button>
                )}
            </div>
        </PageTemplate>
    );
}
