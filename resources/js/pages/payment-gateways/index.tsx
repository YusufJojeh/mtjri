import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function PaymentGatewaysIndex() {
  const { t } = useTranslation();

  return (
    <PageTemplate title={t('Payment Gateways')} url='/payment-gateways'>
      <Card>
        <CardHeader>
          <CardTitle>{t('Payment Gateways')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>
            {t('Manage gateway configuration from Payment Settings.')}
          </p>
          <Button asChild>
            <Link href={route('settings')}>
              {t('Open Settings')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
