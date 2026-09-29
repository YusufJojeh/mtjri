import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/utils/sanitize';

const looksLikeHtml = (s: string) => /<\/?[a-z][\s\S]*>/i.test(s);

/**
 * Renders merchant-authored rich text. HTML is sanitized with DOMPurify;
 * plain text keeps its line breaks. Local typography (no prose plugin in this app).
 */
export function RichContent({ value, className }: { value: string | null | undefined; className?: string }) {
    const html = useMemo(() => (value && looksLikeHtml(value) ? sanitizeHtml(value) : null), [value]);
    const base = cn('text-foreground/90 text-sm leading-6 break-words', className);
    if (!value) return null;
    if (html === null) return <p className={cn(base, 'whitespace-pre-line')}>{value}</p>;
    return (
        <div
            className={cn(
                base,
                '[&_a]:text-primary [&_a]:underline [&_blockquote]:border-s-2 [&_blockquote]:ps-3 [&_blockquote]:text-muted-foreground',
                '[&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:font-semibold [&_h3]:mb-1 [&_h3]:font-semibold',
                '[&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:ps-5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:ps-5',
                '[&_img]:max-w-full [&_img]:rounded-md [&_table]:w-full [&_td]:border [&_td]:p-1.5 [&_th]:border [&_th]:p-1.5',
            )}
            // Sanitized with DOMPurify above.
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
