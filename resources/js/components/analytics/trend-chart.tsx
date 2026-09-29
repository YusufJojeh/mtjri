import { Area, ComposedChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useCommerceFormat } from '@/hooks/use-commerce-format';

export interface SeriesPoint {
    date: string;
    previous_date: string;
    revenue: number;
    orders: number;
    previous_revenue: number;
    previous_orders: number;
}

interface Props {
    data: SeriesPoint[];
    metric: 'revenue' | 'orders';
    showPrevious: boolean;
    height?: number;
    /** Label for the accessible summary and legend. */
    label: string;
    /** Plain-language summary shown as the figure caption. */
    summary: string;
}

const parseDay = (d: string) => {
    const [y, m, dd] = d.split('-').map(Number);
    return new Date(y, m - 1, dd);
};

/**
 * Current period as a filled line, previous period as a recessive gray line on
 * the same (single) axis. Mirrors direction in RTL so time flows right-to-left.
 */
export function TrendChart({ data, metric, showPrevious, height = 240, label, summary }: Props) {
    const { t } = useTranslation();
    const f = useCommerceFormat();
    const prevKey = metric === 'revenue' ? 'previous_revenue' : 'previous_orders';
    const fmtValue = (v: number) => (metric === 'revenue' ? f.money(v) : f.number(v));
    const fmtAxis = (v: number) => (metric === 'revenue' ? f.money(v, { compact: true }) : f.number(v, { notation: 'compact' }));
    const fmtDay = (d: string) => f.date(parseDay(d), { day: 'numeric', month: 'short' });
    const gradientId = `grad-${metric}`;

    return (
        <figure className="m-0" aria-label={label}>
            <figcaption className="text-muted-foreground mb-2 text-xs">{summary}</figcaption>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-2 text-xs" aria-hidden>
                <span className="text-foreground inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded-full" style={{ background: 'var(--chart-1)' }} />
                    {t('This period')}
                </span>
                {showPrevious && (
                    <span className="text-muted-foreground inline-flex items-center gap-1.5">
                        <span className="h-0.5 w-4 rounded-full" style={{ background: 'var(--chart-2)' }} />
                        {t('Previous period')}
                    </span>
                )}
            </div>
            <div style={{ height }} dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.16} />
                                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis
                            dataKey="date"
                            reversed={f.isRtl}
                            tickFormatter={fmtDay}
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--border)' }}
                            minTickGap={24}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            orientation={f.isRtl ? 'right' : 'left'}
                            tickFormatter={fmtAxis}
                            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                            tickLine={false}
                            axisLine={false}
                            width={metric === 'revenue' ? 64 : 36}
                            allowDecimals={metric !== 'orders'}
                        />
                        <Tooltip
                            cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const p = payload[0].payload as SeriesPoint;
                                const cur = metric === 'revenue' ? p.revenue : p.orders;
                                const prev = metric === 'revenue' ? p.previous_revenue : p.previous_orders;
                                return (
                                    <div dir={f.isRtl ? 'rtl' : 'ltr'} className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-pop">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className="size-2 rounded-full" style={{ background: 'var(--chart-1)' }} />
                                                {f.date(parseDay(p.date))}
                                            </span>
                                            <span className="font-semibold tabular-nums">{fmtValue(cur)}</span>
                                        </div>
                                        {showPrevious && (
                                            <div className="text-muted-foreground mt-1 flex items-center justify-between gap-4">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className="size-2 rounded-full" style={{ background: 'var(--chart-2)' }} />
                                                    {f.date(parseDay(p.previous_date))}
                                                </span>
                                                <span className="tabular-nums">{fmtValue(prev)}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            }}
                        />
                        {showPrevious && (
                            <Line
                                type="monotone"
                                dataKey={prevKey}
                                stroke="var(--chart-2)"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                                isAnimationActive={false}
                                name={t('Previous period')}
                            />
                        )}
                        <Area
                            type="monotone"
                            dataKey={metric}
                            stroke="var(--chart-1)"
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)', fill: 'var(--chart-1)' }}
                            isAnimationActive={false}
                            name={label}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </figure>
    );
}
