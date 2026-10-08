import * as cheerio from "cheerio";
import {glob} from "glob";
import * as fs from "fs";
import * as lunr from "lunr";


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
      builder.add(info);
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
    const {bodySelector, logger = silentLogger} = normalizeOptions(options);
    const infos: IFileInformation[] = files.map((file) => {
      logger.info(`Indexing ${file.relative}`);
      const dom = cheerio.load(file.contents.toString());
      return {
        body: dom(bodySelector || "body").text().replace(/\s\s+/g, " "),
        href: file.relative,
        description: dom("meta[name='description']").attr("content"),
        keywords: dom("meta[name='keywords']").attr("content"),
        title: dom("head title").text(),
      };
    });

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
    const files = await glob(pattern, {dotRelative: false, nodir: true});
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
