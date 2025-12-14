/**
 * Converts simple markdown (bold, italic) to HTML.
 * @param text The text with markdown.
 * @returns An HTML string.
 */
export function markdownToHtml(text: string): string {
    if (!text) return '';
    let html = text
        // Escape HTML to prevent XSS
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
    // Italic: *text* or _text_
    html = html.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
    // Strikethrough: ~~text~~
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
    // Newlines to <br>
    html = html.replace(/\n/g, '<br>');

    return html;
}

/**
 * Strips all HTML tags from a string.
 * @param html The HTML string.
 * @returns The plain text string.
 */
export function stripHtml(html: string): string {
    if (!html) return '';
    // Replace <br> and <p> tags with newlines for better text structure
    const withNewlines = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n');
    const doc = new DOMParser().parseFromString(withNewlines, 'text/html');
    return doc.body.textContent || "";
}

/**
 * Converts a plain text string with newlines into simple HTML paragraphs.
 * @param text The plain text string.
 * @returns An HTML string with paragraphs.
 */
export function plainTextToHtml(text: string): string {
  if (!text) return '';
  return text.split('\n').map(line => `<p>${line}</p>`).join('');
}

/**
 * Triggers a browser download for a text file.
 * @param content The text content of the file.
 * @param filename The desired name of the file.
 */
export function downloadText(content: string, filename: string): void {
  const element = document.createElement("a");
  const file = new Blob([content], {type: 'text/plain;charset=utf-8'});
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element); // Required for Firefox
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href); // Clean up
}