import DOMPurify from 'dompurify';

type DOMPurifySanitizeConfig = NonNullable<Parameters<typeof DOMPurify.sanitize>[1]>;

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @param config - Optional DOMPurify configuration
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string, config?: DOMPurifySanitizeConfig): string {
  if (typeof window === 'undefined') {
    // Server-side rendering: return empty string or basic sanitization
    return html;
  }

  const sanitizeConfig = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
      'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'sub', 'sup', 'small'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id',
      'width', 'height', 'colspan', 'rowspan', 'align'
    ],
    ALLOW_DATA_ATTR: false,
    ...config
  };

  return DOMPurify.sanitize(html, sanitizeConfig) as string;
}

/**
 * Sanitizes HTML for pagination links (more restrictive)
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizePaginationHtml(html: string): string {
  if (typeof window === 'undefined') {
    return html;
  }

  const sanitizeConfig = {
    ALLOWED_TAGS: ['span', 'strong', 'em'],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false
  };

  return DOMPurify.sanitize(html, sanitizeConfig) as string;
}

