import { cn } from '@/lib/utils';

export interface BarTableColumn {
    key: string;
    header: string;
    /** Rendered value for a row. */
    render: (row: BarTableRow) => React.ReactNode;
    /** Hide on phones. */
    hideOnMobile?: boolean;
}

export interface BarTableRow {
    id: string | number;
    label: React.ReactNode;
    /** Magnitude drawn as the bar (same unit across rows). */
    measure: number;
    sub?: React.ReactNode;
    [k: string]: unknown;
}

/**
 * Ranked table where the first column carries a thin magnitude bar.
 * One series → one colour; values stay in text ink.
 */
export function BarTable({ rows, columns, labelHeader, caption, barClassName }: { rows: BarTableRow[]; columns: BarTableColumn[]; labelHeader: string; caption: string; barClassName?: string }) {
    const max = Math.max(...rows.map((r) => r.measure), 0);
    return (
        <table className="w-full table-fixed border-collapse text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead>
                <tr className="text-muted-foreground border-b text-xs">
                    <th scope="col" className="h-8 pe-3 text-start font-medium">
                        {labelHeader}
                    </th>
                    {columns.map((c) => (
                        <th key={c.key} scope="col" className={cn('h-8 w-24 ps-2 text-end font-medium whitespace-nowrap sm:w-28', c.hideOnMobile && 'hidden sm:table-cell')}>
                            {c.header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pe-3 align-top">
                            <div className="truncate font-medium">{r.label}</div>
                            {r.sub ? <div className="text-muted-foreground truncate text-xs">{r.sub}</div> : null}
                            <div className="mt-1.5 h-1.5 w-full" aria-hidden>
                                <div
                                    className={cn('h-full rounded-full', barClassName ?? 'bg-[var(--chart-1)]')}
                                    style={{ width: `${max > 0 ? Math.max((r.measure / max) * 100, r.measure > 0 ? 2 : 0) : 0}%` }}
                                />
                            </div>
                        </td>
                        {columns.map((c) => (
                            <td key={c.key} className={cn('py-2 ps-2 text-end align-top tabular-nums whitespace-nowrap', c.hideOnMobile && 'hidden sm:table-cell')}>
                                {c.render(r)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
