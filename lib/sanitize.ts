/**
 * Server-side input sanitization utilities.
 * No external dependencies — uses string replacement for safety.
 */

/** HTML entity map for escaping */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

/**
 * Escape HTML special characters to prevent XSS.
 * Use this for any user input that will be rendered as text.
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'`/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from a string.
 * Returns plain text only.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "") // Remove script blocks
    .replace(/<style[\s\S]*?<\/style>/gi, "")   // Remove style blocks
    .replace(/<[^>]*>/g, "")                      // Remove remaining tags
    .replace(/&nbsp;/gi, " ")
    .trim();
}

/**
 * Sanitize a plain text input (name, title, etc.)
 * - Trims whitespace
 * - Removes control characters
 * - Limits length
 */
export function sanitizeText(input: string, maxLength = 500): string {
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control chars (keep \n, \r, \t)
    .slice(0, maxLength);
}

/**
 * Sanitize a URL — only allow http/https protocols.
 * Returns the URL if safe, or empty string if suspicious.
 */
export function sanitizeUrl(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return trimmed;
    }
    return "";
  } catch {
    // Not a valid URL
    return "";
  }
}

/**
 * Check if a form submission contains honeypot field values (bot detection).
 * Add a hidden field to forms — real users leave it empty, bots fill it.
 *
 * Usage in API route:
 *   if (isHoneypotFilled(body.website)) return 403;
 */
export function isHoneypotFilled(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  return true;
}

/**
 * Sanitize an object's string fields recursively.
 * Useful for sanitizing request bodies before processing.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  maxFieldLength = 1000
): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const value = result[key];
    if (typeof value === "string") {
      (result as any)[key] = sanitizeText(value, maxFieldLength);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      (result as any)[key] = sanitizeObject(
        value as Record<string, unknown>,
        maxFieldLength
      );
    }
  }
  return result;
}
