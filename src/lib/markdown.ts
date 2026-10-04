import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

/**
 * `articles.contentMd` holds HTML (despite the column name, kept as-is to
 * avoid an unnecessary rename migration) — produced either by converting
 * Gemini's Markdown output once at generation time (see lib/gemini.ts), or
 * directly by the Tiptap editor on manual/edit saves. This function is the
 * single sanitize-at-read-time guard (SECURITY.md §3) applied no matter
 * which path the content came from.
 */
export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["target", "rel"],
  });
}

/** Converts Gemini's Markdown output to HTML once, at generation time. */
export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

/** Strips tags for feeding stored (HTML) content back into an AI prompt cleanly. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
