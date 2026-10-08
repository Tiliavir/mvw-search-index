import type * as Lunr from "lunr";

// lunr-languages plugins register themselves by mutating the lunr module object, so
// they need the actual CommonJS export - an ES namespace wrapper (as created by
// bundlers and test runners for `import * as`) would silently drop the additions.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const lunr: typeof Lunr = require("lunr");

/** lunr's built-in language; needs no plugin. */
export const DEFAULT_LANGUAGE = "en";

let stemmerSupportLoaded = false;

/**
 * Returns the lunr-languages plugin for `language` (an ISO 639-1 code such as
 * "de"), registering it with lunr on first use, or `undefined` for English.
 */
export function languagePlugin(language: string): Lunr.Builder.Plugin | undefined {
  if (language === DEFAULT_LANGUAGE) {
    return undefined;
  }
  if (!/^[a-z]{2}$/.test(language)) {
    throw new Error(`Invalid language "${language}": expected a two-letter code such as "de" or "fr".`);
  }

  const registry = lunr as unknown as Record<string, Lunr.Builder.Plugin | undefined>;
  if (!registry[language]) {
    try {
      if (!stemmerSupportLoaded) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded on demand, synchronously
        require("lunr-languages/lunr.stemmer.support")(lunr);
        stemmerSupportLoaded = true;
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded on demand, synchronously
      require(`lunr-languages/lunr.${language}`)(lunr);
    } catch (err) {
      throw new Error(`Unsupported language "${language}": ${err instanceof Error ? err.message : err}. `
        + "See https://github.com/MihaiValentin/lunr-languages for the supported languages.", {cause: err});
    }
  }
  const plugin = registry[language];
  if (!plugin) {
    throw new Error(`Unsupported language "${language}".`);
  }
  return plugin;
}
