import { diffWords, htmlToText, textToHtml } from '../diff';

describe('diffWords', () => {
    it('marks additions and removals at word level', () => {
        const parts = diffWords('A soft cotton shirt', 'A soft linen shirt');
        expect(parts.filter((p) => p.type === 'removed').map((p) => p.text.trim())).toEqual(['cotton']);
        expect(parts.filter((p) => p.type === 'added').map((p) => p.text.trim())).toEqual(['linen']);
        expect(parts.map((p) => (p.type === 'removed' ? '' : p.text)).join('')).toBe('A soft linen shirt');
    });

    it('handles empty current content as a pure addition', () => {
        expect(diffWords('', 'New copy')).toEqual([{ type: 'added', text: 'New copy' }]);
    });
});

describe('html helpers', () => {
    it('extracts text without executing markup', () => {
        expect(htmlToText('<p>Hello <b>world</b></p><script>alert(1)</script>')).toContain('Hello world');
    });
    it('escapes proposals before they become rich text', () => {
        expect(textToHtml('<img src=x onerror=alert(1)>\n\nSecond')).toBe('<p>&lt;img src=x onerror=alert(1)&gt;</p><p>Second</p>');
    });
});

