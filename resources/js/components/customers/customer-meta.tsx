import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils/image-helper';

type T = (key: string, opts?: Record<string, unknown>) => string;

export function customerGroupLabel(group: string | null | undefined, t: T): string {
    switch ((group || '').toLowerCase()) {
        case 'regular':
            return t('Regular');
        case 'vip':
            return t('VIP');
        case 'wholesale':
            return t('Wholesale');
        default:
            return group || '';
    }
}

/** Initials avatar; shows the uploaded picture when it loads. */
export function CustomerAvatar({ initials, avatar, size = 'md' }: { initials: string; avatar?: string | null; size?: 'md' | 'lg' }) {
    const [failed, setFailed] = useState(false);
    const cls = size === 'lg' ? 'size-14 text-lg' : 'size-9 text-xs';
    return (
        <span
            className={cn('bg-muted text-muted-foreground relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold', cls)}
            aria-hidden
        >
            {avatar && !failed ? (
                <img src={getImageUrl(avatar)} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
            ) : (
                <span dir="ltr">{initials || '?'}</span>
            )}
        </span>
    );
}
