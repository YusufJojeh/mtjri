import { PageCrudWrapper } from '@/components/PageCrudWrapper';
import { landingPageNewslettersConfig } from '@/config/crud/landing-page-newsletters';

export default function NewslettersIndex() {
  return (
    <PageCrudWrapper
      config={landingPageNewslettersConfig}
      title='Newsletter Subscriptions'
      url={route('landing-page.newsletters.index')}
    />
  );
}