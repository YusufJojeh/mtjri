import { Package } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils/image-helper';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import type { StockState } from '@/lib/commerce/status';

/** Square product image with a neutral placeholder (also used when the file is missing). */
export function ProductThumb({ src, alt, size = 'md', className }: { src?: string | null; alt: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
    const [broken, setBroken] = useState(false);
    const dims = { sm: 'size-9', md: 'size-10', lg: 'size-14', xl: 'size-20 sm:size-24' }[size];
    return (
        <div className={cn('bg-muted text-muted-foreground flex shrink-0 items-center justify-center overflow-hidden rounded-lg border', dims, className)}>
            {src && !broken ? (
                <img src={getImageUrl(src)} alt={alt} loading="lazy" className="size-full object-cover" onError={() => setBroken(true)} />
            ) : (
                <Package className={size === 'xl' ? 'size-7' : 'size-4'} aria-hidden />
            )}
        </div>
    );
}

/** A sale price only applies when it is set and lower than the regular price (matches the storefront). */
export function effectivePrice(price: number | string | null | undefined, salePrice: number | string | null | undefined) {
    const p = Number(price ?? 0);
    const s = salePrice === null || salePrice === undefined || salePrice === '' ? null : Number(salePrice);
    const onSale = s !== null && Number.isFinite(s) && s < p;
    return { price: p, sale: onSale ? s! : null, onSale };
}

export function PriceCell({ price, salePrice, className }: { price: number | string | null | undefined; salePrice?: number | string | null; className?: string }) {
    const { money } = useCommerceFormat();
    const { t } = useTranslation();
    const e = effectivePrice(price, salePrice);
    if (!e.onSale) return <span className={cn('tabular-nums', className)}>{money(e.price)}</span>;
    return (
        <span className={cn('inline-flex flex-wrap items-baseline gap-x-1.5 tabular-nums', className)}>
            <span className="text-foreground font-medium">{money(e.sale)}</span>
            <s className="text-muted-foreground text-xs">
                <span className="sr-only">{t('Regular price')}: </span>
                {money(e.price)}
            </s>
        </span>
    );
}

/**
 * Stock vs low-stock threshold. The filled part encodes stock / (2 × threshold)
 * so the threshold sits at the midpoint marker; beyond 2× it is simply full.
 */
export function StockMeter({ stock, threshold, state, className }: { stock: number; threshold: number; state: StockState; className?: string }) {
    const { t } = useTranslation();
    const { number } = useCommerceFormat();
    const scale = Math.max(1, threshold * 2);
    const pct = Math.max(0, Math.min(100, (stock / scale) * 100));
    const fill = state === 'out_of_stock' ? 'bg-danger' : state === 'low_stock' ? 'bg-warning' : 'bg-success';
    return (
        <div
            className={cn('bg-muted relative h-1.5 w-full overflow-hidden rounded-full', className)}
            role="img"
            aria-label={t('{{stock}} in stock, low-stock threshold {{threshold}}', { stock: number(stock), threshold: number(threshold) })}
        >
            <div className={cn('absolute inset-y-0 start-0 rounded-full', fill)} style={{ width: `${pct}%` }} />
            {threshold > 0 && <div className="bg-foreground/40 absolute inset-y-0 start-1/2 w-px" aria-hidden />}
        </div>
    );
}
