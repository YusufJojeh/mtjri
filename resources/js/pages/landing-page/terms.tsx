import LegalPage from '@/components/public/LegalPage';
import { usePage } from '@inertiajs/react';
import type { PublicPageProps } from './lib/public-page';

export default function TermsPage() {
    const { settings, customPages } = usePage<PublicPageProps>().props;
    return <LegalPage doc="terms" settings={settings} customPages={customPages} />;
}
