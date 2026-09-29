import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SegmentedTabs } from '@/components/ds/data-table';
import { Button } from '@/components/ui/button';

export type RangeKey = '7d' | '30d' | '90d' | 'mtd' | 'custom';

export interface RangeMeta {
    key: RangeKey;
    from: string;
    to: string;
    previous_from: string;
    previous_to: string;
    days: number;
}

/** Period switcher. State lives in the URL (?range=&from=&to=). */
export function RangeControl({ range, onChange, busy }: { range: RangeMeta; onChange: (q: { range: RangeKey; from?: string; to?: string }) => void; busy?: boolean }) {
    const { t } = useTranslation();
    const [showCustom, setShowCustom] = useState(range.key === 'custom');
    const [from, setFrom] = useState(range.from);
    const [to, setTo] = useState(range.to);
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const segments = [
        { value: '7d', label: t('7 days') },
        { value: '30d', label: t('30 days') },
        { value: '90d', label: t('90 days') },
        { value: 'mtd', label: t('Month to date') },
        { value: 'custom', label: t('Custom') },
    ];

    const valid = Boolean(from && to && from <= to);

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center" aria-busy={busy}>
            <SegmentedTabs
                label={t('Date range')}
                segments={segments}
                value={showCustom ? 'custom' : range.key}
                onChange={(v) => {
                    if (v === 'custom') {
                        setShowCustom(true);
                        return;
                    }
                    setShowCustom(false);
                    onChange({ range: v as RangeKey });
                }}
            />
            {showCustom && (
                <form
                    className="flex flex-wrap items-end gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (valid) onChange({ range: 'custom', from, to });
                    }}
                >
                    <label className="text-muted-foreground grid gap-1 text-xs">
                        {t('From')}
                        <input
                            type="date"
                            value={from}
                            max={to || todayIso}
                            onChange={(e) => setFrom(e.target.value)}
                            className="border-input bg-background text-foreground focus-visible:ring-ring/40 h-9 rounded-lg border px-2 text-sm outline-none focus-visible:ring-[3px]"
                        />
                    </label>
                    <label className="text-muted-foreground grid gap-1 text-xs">
                        {t('To')}
                        <input
                            type="date"
                            value={to}
                            min={from}
                            max={todayIso}
                            onChange={(e) => setTo(e.target.value)}
                            className="border-input bg-background text-foreground focus-visible:ring-ring/40 h-9 rounded-lg border px-2 text-sm outline-none focus-visible:ring-[3px]"
                        />
                    </label>
                    <Button type="submit" size="sm" className="h-9" disabled={!valid || busy}>
                        {t('Apply')}
                    </Button>
                </form>
            )}
        </div>
    );
}
