import * as cheerio from "cheerio";
import {glob} from "glob";
import * as fs from "fs";
import * as lunr from "lunr";
import {DEFAULT_EXCLUDE_SELECTOR, extractMetadata, extractText, isNoindex} from "./html";

export {DEFAULT_EXCLUDE_SELECTOR};


export declare interface IResultStore {
  [key: string]: {
    title: string;
    description?: string;
  };
}

export declare interface IFileInformation {
  body: string;
  description?: string;
  href: string;
  keywords?: string;
  title: string;
}

export declare interface ISearchIndexResult {
  index: lunr.Index;
  store: IResultStore;
}

/** An HTML document to index. */
export declare interface HtmlFile {
  /** The raw HTML. */
  contents: Buffer | string;
  /** Path of the file; used as the `href` of the search result. */
  relative: string;
}

/** @deprecated Use {@link HtmlFile}. */
export type ReadFileWithContents = HtmlFile;

/** Receives progress and diagnostic messages. `console` satisfies this interface. */
export declare interface Logger {
  info(message: string): void;
  warn(message: string): void;
}

const silentLogger: Logger = {
  info: () => undefined,
  warn: () => undefined,
};

export declare interface SearchIndexOptions {
  /** CSS selector of the element(s) whose text is indexed as body. Default: `"body"`. */
  bodySelector?: string;
  /**
   * CSS selector of elements inside the body to leave out, e.g. navigation and footers
   * that repeat on every page. Use `""` to exclude nothing. Default: `"nav, footer"`.
   */
  excludeSelector?: string;
  /**
   * Skip pages with `<meta name="robots" content="noindex">` (or `none`), just like
   * search engines do. Default: `true`.
   */
  respectNoindex?: boolean;
  /**
   * `createFromGlob` only: resolve with an empty index instead of rejecting when the
   * pattern matches no files. Default: `false`.
   */
  allowEmpty?: boolean;
  /** Where to report progress (one message per indexed file). Default: silent. */
  logger?: Logger;
}

function normalizeOptions(options: string | SearchIndexOptions | undefined): SearchIndexOptions {
  return typeof options === "string" ? {bodySelector: options} : {...options};
}

export class SearchIndex {
  private readonly store: IResultStore;
  private readonly index: lunr.Index;

  private constructor(files: IFileInformation[]) {
    this.store = {};
    const builder: lunr.Builder = new lunr.Builder();
    // The same text processing lunr() sets up by default. A bare Builder has empty
    // pipelines, which meant no stemming, no stop word removal and punctuation
    // sticking to words ("konzert," / "page:"). The search pipeline is serialized
    // into the index, so lunr applies the stemmer to queries on the client as well.
    builder.pipeline.add(lunr.trimmer, lunr.stopWordFilter, lunr.stemmer);
    builder.searchPipeline.add(lunr.stemmer);
    builder.field("title");
    builder.field("keywords");
    builder.field("description");
    builder.field("body");
    builder.ref("href");

    files.forEach((info: IFileInformation): void => {
      this.store[info.href] = {
        description: info.description,
        title: info.title,
      };
      // keywords are a comma separated list, but lunr only splits on whitespace and hyphens
      builder.add({...info, keywords: info.keywords?.replace(/[,;]/g, " ")});
    });
    this.index = builder.build();
  }

  public static createFromInfo(files: IFileInformation[]): ISearchIndexResult {
    return new SearchIndex(files).getResult();
  }

  /**
   * @param files HTML documents to index.
   * @param options Options, or - for backwards compatibility - just the body selector.
   */
  public static createFromHtml(files: HtmlFile[], options?: string | SearchIndexOptions): ISearchIndexResult {
    const {bodySelector, excludeSelector, respectNoindex = true, logger = silentLogger} = normalizeOptions(options);
    const infos: IFileInformation[] = [];
    for (const file of files) {
      const dom = cheerio.load(file.contents.toString());
      if (respectNoindex && isNoindex(dom)) {
        logger.info(`Skipping ${file.relative} (robots noindex)`);
        continue;
      }
      logger.info(`Indexing ${file.relative}`);
      const metadata = extractMetadata(dom);
      if (!metadata.title) {
        logger.warn(`${file.relative} has no <title>, og:title or <h1> - its search result will have an empty title`);
      }
      infos.push({
        ...metadata,
        body: extractText(dom, bodySelector || "body", excludeSelector),
        href: file.relative,
      });
    }

    return SearchIndex.createFromInfo(infos);
  }

  /**
   * Indexes all HTML files matching a glob pattern.
   *
   * @param pattern Glob pattern of the HTML files to index.
   * @param options Options, or - for backwards compatibility - just the body selector.
   * @returns The index and result store. Rejects if a file cannot be read.
   */
  public static createFromGlob(pattern: string,
                               options?: string | SearchIndexOptions,
                               ...legacyCallback: never[]): Promise<ISearchIndexResult> {
    if (legacyCallback.length > 0) {
      // 2.x took a callback as third argument. Silently ignoring it would mean the
      // caller's index is simply never written - fail loudly instead.
      throw new TypeError("SearchIndex.createFromGlob() no longer accepts a callback; it returns a Promise. "
        + "See https://github.com/Tiliavir/mvw-search-index/blob/main/UPGRADING.md");
    }
    return SearchIndex.createFromGlobAsync(pattern, normalizeOptions(options));
  }

  private static async createFromGlobAsync(pattern: string, options: SearchIndexOptions): Promise<ISearchIndexResult> {
    // glob's result order depends on the file system - sort for reproducible output
    const files = (await glob(pattern, {dotRelative: false, nodir: true})).sort();
    if (files.length === 0 && !options.allowEmpty) {
      throw new Error(`No files match "${pattern}" (relative to ${process.cwd()}). `
        + "Set the allowEmpty option to create an empty index anyway.");
    }
    const readFiles: HtmlFile[] = await Promise.all(files.map(async (file) => ({
      relative: file,
      contents: await fs.promises.readFile(file),
    })));
    return SearchIndex.createFromHtml(readFiles, options);
  }

  private getResult(): ISearchIndexResult {
    return {
      index: this.index,
      store: this.store,
    };
  }
}
