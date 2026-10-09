export declare interface HrefOptions {
  /** Prefix for every href, e.g. `"/"` or `"https://example.org/docs/"`. Default: `""`. */
  baseUrl?: string;
  /** Turn `foo/index.html` into `foo/` (and `index.html` into the base URL). Default: `false`. */
  stripIndexHtml?: boolean;
}

/** Turns the path of an indexed file into the `href` of its search result. */
export function toHref(relativePath: string, options: HrefOptions = {}): string {
  // Windows paths use backslashes, URLs never do.
  let href = relativePath.replace(/\\/g, "/").replace(/^\.\//, "");
  if (options.stripIndexHtml) {
    href = href.replace(/(^|\/)index\.html?$/, "$1");
  }
  const baseUrl = trimTrailingSlashes(options.baseUrl ?? "");
  if (options.baseUrl) {
    href = baseUrl + "/" + href;
  }
  // an empty href would link to the search page itself
  return href || "./";
}

function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") {
    end--;
  }
  return value.slice(0, end);
}
