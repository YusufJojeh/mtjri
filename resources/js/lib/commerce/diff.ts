/**
 * Word-level diff (LCS) for showing "current vs AI proposal" readably.
 * Input is plain text; callers must strip HTML first (see htmlToText).
 */
export type DiffPart = { type: 'same' | 'added' | 'removed'; text: string };

function tokenize(s: string): string[] {
    return s.split(/(\s+)/).filter((x) => x.length > 0);
}

export function diffWords(before: string, after: string, maxTokens = 1500): DiffPart[] {
    const a = tokenize(before);
    const b = tokenize(after);
    if (a.length > maxTokens || b.length > maxTokens) {
        // Too large for an O(n*m) table – present as full replacement.
        const parts: DiffPart[] = [];
        if (before) parts.push({ type: 'removed', text: before });
        if (after) parts.push({ type: 'added', text: after });
        return parts;
    }
    const n = a.length;
    const m = b.length;
    const dp: Uint16Array[] = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }
    const out: DiffPart[] = [];
    const push = (type: DiffPart['type'], text: string) => {
        const last = out[out.length - 1];
        if (last && last.type === type) last.text += text;
        else out.push({ type, text });
    };
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (a[i] === b[j]) {
            push('same', a[i]);
            i++;
            j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            push('removed', a[i++]);
        } else {
            push('added', b[j++]);
        }
    }
    while (i < n) push('removed', a[i++]);
    while (j < m) push('added', b[j++]);
    return out;
}

/** Convert (untrusted) HTML to plain text without executing anything. */
export function htmlToText(html: string | null | undefined): string {
    if (!html) return '';
    if (typeof DOMParser === 'undefined') return String(html).replace(/<[^>]*>/g, ' ');
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
    doc.querySelectorAll('p,div,li,h1,h2,h3,h4').forEach((el) => el.append('\n'));
    return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

/** Plain text → minimal safe HTML paragraphs for rich-text fields. */
export function textToHtml(text: string): string {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return text
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
        .join('');
}
