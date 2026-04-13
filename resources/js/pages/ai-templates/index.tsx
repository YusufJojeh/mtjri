import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AiTemplatesIndex() {
  const { t } = useTranslation();

  return (
    <PageTemplate title={t('AI Templates')} url='/ai-templates'>
      <Card>
        <CardHeader>
          <CardTitle>{t('AI Templates')}</CardTitle>
        </CardHeader>
        <CardContent className='flex items-center gap-3 text-muted-foreground'>
          <Bot className='h-5 w-5' />
          <p>{t('AI template management is available in this area.')}</p>
        </CardContent>
      </Card>
    </PageTemplate>
  );
}
