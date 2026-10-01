/** Props shared by every standalone public marketing page. */
export interface PublicCustomPageNav {
    id: number;
    title: string;
    slug: string;
}

export interface PublicSettings {
    company_name: string;
    contact_email?: string;
    contact_phone?: string;
    contact_address?: string;
    config_sections?: {
        colors?: { primary?: string; secondary?: string; accent?: string };
        seo?: { meta_title?: string; meta_description?: string; meta_keywords?: string };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export interface PublicPageProps {
    [key: string]: unknown;
    settings: PublicSettings;
    customPages?: PublicCustomPageNav[];
}

/** "Page — Company" for <title>. */
export function publicTitle(page: string, settings?: PublicSettings): string {
    return `${page} — ${settings?.company_name || 'Tijraa'}`;
}
