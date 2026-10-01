import LegalPage from '@/components/public/LegalPage';
import { usePage } from '@inertiajs/react';
import type { PublicPageProps } from './lib/public-page';

export default function PrivacyPage() {
    const { settings, customPages } = usePage<PublicPageProps>().props;
    return <LegalPage doc="privacy" settings={settings} customPages={customPages} />;
}
