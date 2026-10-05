import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/**
 * `articles.contentMd` holds HTML (despite the column name, kept as-is to
 * avoid an unnecessary rename migration) — produced either by converting
 * Gemini's Markdown output once at generation time (see lib/gemini.ts), or
 * directly by the Tiptap editor on manual/edit saves. This function is the
 * single sanitize-at-read-time guard (SECURITY.md §3) applied no matter
 * which path the content came from.
 *
 * Memakai sanitize-html (tanpa jsdom) supaya aman dijalankan di serverless.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr", "div", "span",
    "strong", "b", "em", "i", "u", "s", "strike", "mark", "sub", "sup",
    "blockquote", "code", "pre",
    "ul", "ol", "li",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    "iframe",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel", "title"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    iframe: ["src", "width", "height", "title", "allow", "allowfullscreen", "frameborder"],
    code: ["class"],
    pre: ["class"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
    ol: ["start"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  // Iframe hanya untuk embed video dari host tepercaya.
  allowedIframeHostnames: [
    "www.youtube.com",
    "www.youtube-nocookie.com",
    "player.vimeo.com",
  ],
  transformTags: {
    a: (tagName, attribs) => {
      if (attribs.target === "_blank") {
        return { tagName, attribs: { ...attribs, rel: "noopener noreferrer" } };
      }
      return { tagName, attribs };
    },
  },
};

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS);
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
