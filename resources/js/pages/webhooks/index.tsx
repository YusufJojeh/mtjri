import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import WebhookSettings from '@/pages/settings/components/webhook-settings';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function WebhooksIndex() {
  const { t } = useTranslation();
  const { webhooks = [] } = usePage().props as any;

  return (
    <PageTemplate title={t('Webhook Settings')} url='/webhooks'>
      <Card>
        <CardHeader>
          <CardTitle>{t('Webhook Settings')}</CardTitle>
        </CardHeader>
        <CardContent>
          <WebhookSettings webhooks={webhooks} />
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
