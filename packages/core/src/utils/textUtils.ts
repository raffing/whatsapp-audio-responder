/**
 * Basic text formatting utilities - platform agnostic
 */

/**
 * Escapes HTML special characters to prevent XSS.
 * @param text The text to escape.
 * @returns The escaped text.
 */
export function escapeHtml(text: string): string {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Strips HTML tags from a string using regex (platform-agnostic).
 * @param html The HTML string.
 * @returns The plain text string.
 */
export function stripHtmlTags(html: string): string {
    if (!html) return '';
    // Replace <br> and <p> tags with newlines for better text structure
    const withNewlines = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<p>/gi, '');
    // Remove all other HTML tags
    return withNewlines.replace(/<[^>]*>/g, '');
}

/**
 * Converts markdown-style formatting to plain text (removes formatting).
 * @param text The text with markdown.
 * @returns Plain text without markdown syntax.
 */
export function markdownToPlainText(text: string): string {
    if (!text) return '';
    return text
        // Remove bold: **text** or __text__
        .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '$1$2')
        // Remove italic: *text* or _text_
        .replace(/\*(.*?)\*|_(.*?)_/g, '$1$2')
        // Remove strikethrough: ~~text~~
        .replace(/~~(.*?)~~/g, '$1');
}