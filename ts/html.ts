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

/** Collapses all whitespace runs (including single newlines and tabs) into one space. */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Returns the visible text of all elements matching `selector`, with block-level
 * elements and separate matches delimited by spaces.
 *
 * Note: modifies the document.
 */
export function extractText($: CheerioAPI, selector: string): string {
  $("br").replaceWith(" ");
  $(BLOCK_ELEMENTS).prepend(" ").append(" ");

  // If matches are nested (e.g. selector "div"), only take the outermost ones -
  // otherwise the inner text would be indexed twice.
  const roots = $(selector).filter((_, el) => $(el).parents(selector).length === 0);
  return normalizeWhitespace(roots.map((_, el) => $(el).text()).get().join(" "));
}
