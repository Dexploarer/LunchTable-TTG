/**
 * XSS Sanitization Utilities
 *
 * Provides comprehensive sanitization for user-generated content to prevent
 * cross-site scripting (XSS) attacks.
 *
 * @module sanitize
 */

import DOMPurify from "dompurify";
import type { Config } from "dompurify";

/**
 * Strict configuration - strips ALL HTML tags
 */
const STRICT_CONFIG: Config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

/**
 * Basic configuration - allows safe formatting tags only
 */
const BASIC_CONFIG: Config = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "br"],
  ALLOWED_ATTR: ["href"],
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Sanitizes plain text by removing all HTML and escaping special characters
 *
 * Use for: usernames, agent names, profile bios, search queries
 *
 * @param input - Text to sanitize
 * @returns Sanitized plain text with HTML entities encoded
 *
 * @example
 * ```typescript
 * const username = sanitizeText(userInput); // "<script>alert('xss')</script>" → "&lt;script&gt;alert('xss')&lt;/script&gt;"
 * ```
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";

  // First pass: DOMPurify removes dangerous content
  const sanitized = DOMPurify.sanitize(input, STRICT_CONFIG) as unknown as string;

  // Second pass: Escape HTML entities
  return sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Sanitizes HTML content while preserving safe formatting tags
 *
 * Use for: rich text content that needs basic formatting
 *
 * @param input - HTML to sanitize
 * @returns Sanitized HTML with only safe tags preserved
 *
 * @example
 * ```typescript
 * const bio = sanitizeHTML(userBio); // Keeps <b>, <i>, <a> but removes <script>
 * ```
 */
export function sanitizeHTML(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, BASIC_CONFIG) as unknown as string;
}

/**
 * Sanitizes chat messages and converts newlines to <br> tags
 *
 * Use for: chat messages, comments
 *
 * @param input - Chat message to sanitize
 * @returns Sanitized message with newlines converted to <br>
 *
 * @example
 * ```typescript
 * const message = sanitizeChatMessage(userMessage);
 * // "Hello\nWorld" → "Hello<br>World"
 * // "<script>xss</script>" → "&lt;script&gt;xss&lt;/script&gt;"
 * ```
 */
export function sanitizeChatMessage(input: string | null | undefined): string {
  if (!input) return "";

  // Strip all HTML first
  const sanitized = sanitizeText(input);

  // Convert newlines to <br> for display
  return sanitized.replace(/\n/g, "<br>");
}

/**
 * Sanitizes URLs and validates protocol safety
 *
 * Use for: user-provided links, redirects
 *
 * @param input - URL to sanitize
 * @returns Safe URL or empty string if dangerous protocol detected
 *
 * @example
 * ```typescript
 * const url = sanitizeURL(userUrl);
 * // "javascript:alert('xss')" → ""
 * // "example.com" → "https://example.com"
 * // "https://safe.com" → "https://safe.com"
 * ```
 */
export function sanitizeURL(input: string | null | undefined): string {
  if (!input) return "";

  const trimmed = input.trim();

  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i;
  if (dangerousProtocols.test(trimmed)) {
    return "";
  }

  // Add https:// if no protocol specified
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Sanitizes agent names with strict alphanumeric rules
 *
 * Use for: agent registration names
 *
 * @param input - Agent name to sanitize
 * @returns Sanitized name (max 32 chars, alphanumeric + spaces/hyphens/underscores only)
 *
 * @example
 * ```typescript
 * const agentName = sanitizeAgentName(input);
 * // "My Agent <script>" → "My Agent script"
 * // "Agent™" → "Agent"
 * ```
 */
export function sanitizeAgentName(input: string | null | undefined): string {
  if (!input) return "";

  return input
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .trim()
    .slice(0, 32);
}

/**
 * Creates a sanitized HTML object for React's dangerouslySetInnerHTML
 *
 * Use for: rendering sanitized HTML in React components
 *
 * @param input - HTML to sanitize
 * @returns Object with __html property containing sanitized HTML
 *
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={createSanitizedHTML(userContent)} />
 * ```
 */
export function createSanitizedHTML(input: string | null | undefined) {
  return { __html: sanitizeHTML(input) };
}

/**
 * Sanitizes search queries with length limit
 *
 * Use for: search inputs, query parameters
 *
 * @param input - Search query to sanitize
 * @returns Sanitized query (max 100 chars)
 *
 * @example
 * ```typescript
 * const query = sanitizeSearchQuery(userSearch);
 * ```
 */
export function sanitizeSearchQuery(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeText(input).slice(0, 100);
}
