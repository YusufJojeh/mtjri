import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCommerceFormat } from '@/hooks/use-commerce-format';

export interface TrendPoint {
    date: string;
    sales: number;
    orders: number;
    prevSales: number;
}

/**
 * Current period (brand area) vs previous period (dashed neutral line).
 * The dashed stroke + legend carry identity, so color is never the only cue.
 */
export function SalesTrendChart({ data, height = 240 }: { data: TrendPoint[]; height?: number }) {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const rtl = fmt.isRtl;

    const summary = useMemo(() => {
        const total = data.reduce((s, p) => s + p.sales, 0);
        const prev = data.reduce((s, p) => s + p.prevSales, 0);
        const best = data.reduce((b, p) => (p.sales > b.sales ? p : b), data[0] ?? { date: '', sales: 0, orders: 0, prevSales: 0 });
        return t('Sales totalled {{total}} over {{days}} days, compared with {{prev}} in the previous period. Best day was {{day}} with {{best}}', {
            total: fmt.money(total),
            days: data.length,
            prev: fmt.money(prev),
            day: fmt.date(best.date, { month: 'short', day: 'numeric' }),
            best: fmt.money(best.sales),
        });
    }, [data, fmt, t]);

    return (
        <figure className="m-0">
            <div className="text-muted-foreground mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" aria-hidden>
                <span className="inline-flex items-center gap-1.5">
                    <span className="bg-primary h-0.5 w-4 rounded-full" />
                    {t('This period')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="border-muted-foreground/60 w-4 border-t-2 border-dashed" />
                    {t('Previous period')}
                </span>
            </div>
            <div style={{ height }} dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
                        <defs>
                            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.18} />
                                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="date"
                            reversed={rtl}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={28}
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            tickFormatter={(d: string) => fmt.date(d, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis
                            orientation={rtl ? 'right' : 'left'}
                            tickLine={false}
                            axisLine={false}
                            width={52}
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            tickFormatter={(v: number) => fmt.money(v, { compact: true })}
                        />
                        <Tooltip
                            cursor={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.4 }}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const p = payload[0].payload as TrendPoint;
                                return (
                                    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-pop" dir={rtl ? 'rtl' : 'ltr'}>
                                        <p className="mb-1 font-medium">{fmt.date(p.date, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                        <p className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">{t('Sales')}</span>
                                            <span className="font-medium tabular-nums">{fmt.money(p.sales)}</span>
                                        </p>
                                        <p className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">{t('Orders')}</span>
                                            <span className="tabular-nums">{fmt.number(p.orders)}</span>
                                        </p>
                                        <p className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">{t('Previous period')}</span>
                                            <span className="tabular-nums">{fmt.money(p.prevSales)}</span>
                                        </p>
                                    </div>
                                );
                            }}
                        />
                        <Line type="monotone" dataKey="prevSales" stroke="var(--muted-foreground)" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                        <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={2} fill="url(#salesFill)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }} isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <figcaption className="sr-only">{summary}</figcaption>
        </figure>
    );
}
