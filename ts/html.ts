import type {CheerioAPI} from "cheerio";

/**
 * Elements that browsers render on their own line (plus table cells). Their text
 * must be separated from the surrounding text, otherwise `<li>a</li><li>b</li>`
 * becomes the single word "ab".
 */
const BLOCK_ELEMENTS: string = [
  "address", "article", "aside", "blockquote", "caption", "dd", "details", "dialog", "div", "dl", "dt",
  "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header",
  "hgroup", "hr", "li", "main", "nav", "ol", "option", "p", "pre", "section", "summary", "table",
  "tbody", "td", "tfoot", "th", "thead", "tr", "ul",
].join(",");

/** Elements whose content is never visible page text. */
const NON_CONTENT_ELEMENTS = "script, style, noscript, template";

/** Collapses all whitespace runs (including single newlines and tabs) into one space. */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Whether the page asks search engines not to index it (`<meta name="robots" content="noindex">`). */
export function isNoindex($: CheerioAPI): boolean {
  return $("meta[name='robots' i]").toArray()
    .some((meta) => /\b(noindex|none)\b/i.test($(meta).attr("content") ?? ""));
}

/** Default for the `excludeSelector` option: site-wide navigation and footers. */
export const DEFAULT_EXCLUDE_SELECTOR = "nav, footer";

/**
 * Returns the visible text of all elements matching `selector`, with block-level
 * elements and separate matches delimited by spaces. Descendants matching
 * `excludeSelector` are left out.
 *
 * Note: modifies the document.
 */
export function extractText($: CheerioAPI, selector: string, excludeSelector: string = DEFAULT_EXCLUDE_SELECTOR): string {
  $(NON_CONTENT_ELEMENTS).remove();
  $("br").replaceWith(" ");
  $(BLOCK_ELEMENTS).prepend(" ").append(" ");

  // If matches are nested (e.g. selector "div"), only take the outermost ones -
  // otherwise the inner text would be indexed twice.
  const roots = $(selector).filter((_, el) => $(el).parents(selector).length === 0);
  if (excludeSelector.trim()) {
    // only descendants: a body selector that itself matches the exclusion still works
    roots.find(excludeSelector).remove();
  }
  return normalizeWhitespace(roots.map((_, el) => $(el).text()).get().join(" "));
}
