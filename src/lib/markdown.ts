import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";

/**
 * Article bodies are stored as Markdown (contentMd). Render to sanitized HTML
 * at display time — see SECURITY.md §3 (treat contentMd as untrusted, even
 * though only staff/editors can write it; AI-generated content included).
 */
export function renderArticleHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml);
}
