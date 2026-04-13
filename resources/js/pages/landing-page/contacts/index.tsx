import { PageCrudWrapper } from '@/components/PageCrudWrapper';
import { landingPageContactsConfig } from '@/config/crud/landing-page-contacts';

export default function ContactsIndex() {
  return (
    <PageCrudWrapper
      config={landingPageContactsConfig}
      title='Contacts'
      url={route('landing-page.contacts.index')}
    />
  );
}