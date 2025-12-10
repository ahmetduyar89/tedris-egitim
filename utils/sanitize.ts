import DOMPurify from 'dompurify';

/**
 * Güvenli HTML Sanitization Utility
 * XSS saldırılarına karşı koruma sağlar
 */

// Temel HTML etiketleri (güvenli)
const BASIC_ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span'];

// Zengin metin editörü için izin verilen etiketler
const RICH_TEXT_ALLOWED_TAGS = [
    ...BASIC_ALLOWED_TAGS,
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote',
    'a',
    'code', 'pre',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
];

// İzin verilen HTML attribute'ları
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

/**
 * Basit metin için sanitization (sadece temel formatlar)
 */
export function sanitizeBasicHtml(dirty: string): string {
    if (!dirty) return '';

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: BASIC_ALLOWED_TAGS,
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false
    });
}

/**
 * Zengin metin için sanitization (daha fazla format)
 */
export function sanitizeRichHtml(dirty: string): string {
    if (!dirty) return '';

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
        ALLOWED_ATTR: ALLOWED_ATTR,
        KEEP_CONTENT: true,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        // Güvenlik için external link'lere rel="noopener noreferrer" ekle
        ADD_ATTR: ['target'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick'],
        FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed']
    });
}

/**
 * Sadece düz metin (tüm HTML etiketlerini kaldır)
 */
export function sanitizeToPlainText(dirty: string): string {
    if (!dirty) return '';

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [],
        KEEP_CONTENT: true
    });
}

/**
 * URL sanitization
 */
export function sanitizeUrl(url: string): string {
    if (!url) return '';

    // Sadece http, https ve mailto protokollerine izin ver
    const allowedProtocols = ['http:', 'https:', 'mailto:'];

    try {
        const urlObj = new URL(url);
        if (allowedProtocols.includes(urlObj.protocol)) {
            return url;
        }
    } catch {
        // Geçersiz URL
    }

    return '';
}

/**
 * React component'lerde kullanım için dangerouslySetInnerHTML wrapper
 */
export function createSafeMarkup(dirty: string, richText: boolean = false) {
    const clean = richText ? sanitizeRichHtml(dirty) : sanitizeBasicHtml(dirty);
    return { __html: clean };
}

export default {
    sanitizeBasicHtml,
    sanitizeRichHtml,
    sanitizeToPlainText,
    sanitizeUrl,
    createSafeMarkup
};
