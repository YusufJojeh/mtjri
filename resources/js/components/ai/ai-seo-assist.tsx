import { Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiProposal, type ProposalState } from '@/components/ds/ai';
import { Button } from '@/components/ui/button';
import { useAiAccess } from '@/hooks/use-ai-access';
import { AiError, generateText, parseSeoProposal } from '@/lib/commerce/ai';
import { htmlToText } from '@/lib/commerce/diff';

type Field = 'title' | 'description' | 'keywords';

interface Props {
    /** What is being optimised, e.g. "blog post" – used in the prompt only. */
    kind: 'blog post' | 'store page';
    subject: string;
    contentHtml: string;
    current: { title: string; description: string; keywords?: string };
    /** Omit keywords when the entity has no keywords field. */
    fields?: Field[];
    onApply: (field: Field, value: string) => void;
}

const LIMITS: Record<Field, number | null> = { title: 60, description: 160, keywords: null };

/**
 * Proposes SEO metadata from the page's own content. Each field is reviewed
 * separately against the current value; accepting only fills the form field,
 * nothing is saved until the merchant saves the post or page.
 */
export function AiSeoAssist({ kind, subject, contentHtml, current, fields = ['title', 'description'], onApply }: Props) {
    const { t, i18n } = useTranslation();
    const allowed = useAiAccess();
    const [states, setStates] = useState<Record<Field, ProposalState>>({ title: { status: 'idle' }, description: { status: 'idle' }, keywords: { status: 'idle' } });
    const abortRef = useRef<AbortController | null>(null);

    if (!allowed) return null;

    const busy = fields.some((f) => states[f].status === 'generating');
    const setAll = (s: ProposalState) => setStates((prev) => ({ ...prev, ...Object.fromEntries(fields.map((f) => [f, s])) }));

    const run = async () => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setAll({ status: 'generating' });
        const body = htmlToText(contentHtml).replace(/\s+/g, ' ').slice(0, 600);
        const prompt = [
            `Write SEO metadata for a ${kind} titled "${subject.slice(0, 120)}".`,
            body ? `Content: ${body}` : '',
            'Reply exactly in this format, keeping the labels Title, Description and Keywords in English:',
            'Title: <max 60 characters>',
            'Description: <max 155 characters, persuasive, no quotes>',
            fields.includes('keywords') ? 'Keywords: <5-8 comma-separated keywords>' : '',
        ]
            .filter(Boolean)
            .join('\n');
        try {
            const raw = await generateText({ prompt, language: i18n.language, creativity: 'low', maxLength: 220, signal: ctrl.signal });
            const parsed = parseSeoProposal(raw);
            setStates((prev) => {
                const next = { ...prev };
                fields.forEach((f) => {
                    const v = parsed[f];
                    next[f] = v ? { status: 'ready', value: v } : { status: 'error', code: 'empty_response' };
                });
                return next;
            });
        } catch (e) {
            if (ctrl.signal.aborted) return;
            setAll({ status: 'error', code: e instanceof AiError ? e.code : 'provider_error' });
        }
    };

    const label: Record<Field, string> = { title: t('Meta Title'), description: t('Meta Description'), keywords: t('Meta Keywords') };
    const anyVisible = fields.some((f) => states[f].status !== 'idle' && states[f].status !== 'applied');

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-muted-foreground text-sm">{t('Draft search-engine title and description from this content')}</p>
                <Button type="button" variant="outline" size="sm" onClick={run} disabled={busy || (!subject.trim() && !htmlToText(contentHtml))}>
                    <Sparkles className="text-ai" />
                    {anyVisible ? t('Regenerate SEO') : t('Suggest SEO with AI')}
                </Button>
            </div>
            {fields.map((f) => {
                const st = states[f];
                const limit = LIMITS[f];
                return (
                    <div key={f}>
                        <AiProposal
                            field={label[f]}
                            current={current[f] ?? ''}
                            state={st}
                            multiline={f === 'description'}
                            acceptHint={
                                st.status === 'ready' && limit
                                    ? t('{{length}} of {{limit}} recommended characters — accepting fills the field only', { length: st.value.length, limit })
                                    : t('Accepting fills the field — nothing is saved until you save')
                            }
                            onAccept={(v) => {
                                onApply(f, v.trim());
                                setStates((prev) => ({ ...prev, [f]: { status: 'applied' } }));
                            }}
                            onReject={() => setStates((prev) => ({ ...prev, [f]: { status: 'idle' } }))}
                            onRegenerate={run}
                        />
                    </div>
                );
            })}
        </div>
    );
}
