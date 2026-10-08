/** Turns the path of an indexed file into the `href` of its search result. */
export function toHref(relativePath: string): string {
  // Windows paths use backslashes, URLs never do.
  return relativePath.replace(/\\/g, "/");
}
