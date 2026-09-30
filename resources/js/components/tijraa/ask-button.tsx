import { Link, usePage } from '@inertiajs/react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import type { TijraaShared } from '@/lib/tijraa/types';

type Resource = 'product' | 'order' | 'customer' | 'discount';

const QUESTIONS: Record<Resource, string> = {
    product: 'How is this product performing, and what should I improve?',
    order: 'Summarise this order and anything I should do next.',
    customer: 'What should I know about this customer?',
    discount: 'Is this discount working? Should I change it?',
};

/** Opens Tijraa Copilot with this record as context (the run is scoped to it). */
export function AskTijraaButton({ type, id, className }: { type: Resource; id: number; className?: string }) {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const ai = (usePage().props as { tijraa?: TijraaShared | null }).tijraa?.ai;
    if (!hasPermission('use-ai-copilot') || !ai?.configured) return null;
    return (
        <Button variant="outline" size="sm" asChild className={className ?? 'h-9 sm:h-8'}>
            <Link href={route('copilot.index', { resource_type: type, resource_id: id, q: t(QUESTIONS[type]) })}>
                <Sparkles className="text-ai" /> {t('Ask Tijraa')}
            </Link>
        </Button>
    );
}
