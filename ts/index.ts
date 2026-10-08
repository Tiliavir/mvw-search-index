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

export declare interface SearchIndexOptions {
  /** CSS selector of the element(s) whose text is indexed as body. Default: `"body"`. */
  bodySelector?: string;
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
    const {bodySelector} = normalizeOptions(options);
    const infos: IFileInformation[] = files.map((file) => {
      console.info(file.relative);
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

  public static createFromGlob(pattern: string,
                               options: string | SearchIndexOptions | undefined,
                               cb: (index: ISearchIndexResult) => void): void {
    glob(pattern, {
      dotRelative: false
    }).then(files => {
        const readFiles: HtmlFile[] = files.map((file) => ({
          relative: file,
          contents: fs.readFileSync(file)
        }));
        cb(SearchIndex.createFromHtml(readFiles, options));
      }
    ).catch(err => {
      throw err;
    });
  }

  private getResult(): ISearchIndexResult {
    return {
      index: this.index,
      store: this.store,
    };
  }
}
