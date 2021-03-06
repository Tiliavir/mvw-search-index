﻿import * as cheerio from "cheerio";
import * as globber from "glob";
import * as File from "vinyl";

const vinylFile: any = require("vinyl-file");
const lunr: any = require ("lunr");

export declare interface IResultStore {
  [key: string]: {
    title: string;
    description: string;
  };
}

export declare interface IFileInformation {
  body: string;
  description: string;
  href: string;
  keywords: string;
  title: string;
}

export declare interface ISearchIndexResult {
  index: lunr.Index;
  store: IResultStore;
}

export class SearchIndex {
  public static createFromInfo(files: IFileInformation[]): ISearchIndexResult {
    return new SearchIndex(files).getResult();
  }

  public static createFromHtml(files: File[], bodySelector: string = "body"): ISearchIndexResult {
    const infos: IFileInformation[] = files.map((file) => {
      console.info(file.relative);
      const dom = cheerio.load(file.contents.toString());
      return {
          body: dom(bodySelector || "body").text().replace(/\s\s+/g, " "),
          description: dom("meta[name='description']").attr("content"),
          href: file.relative,
          keywords: dom("meta[name='keywords']").attr("content"),
          title: dom("head title").text(),
      };
    });

    return SearchIndex.createFromInfo(infos);
  }

  public static createFromGlob(glob: string,
                               bodySelector: string,
                               cb: (index: ISearchIndexResult) => void): void {
    globber(glob, (err: any, files: string[]): void => {
      if (err) {
        throw err;
      } else {
        const vfiles: File[] = files.map((file) => vinylFile.readSync(file));
        cb(SearchIndex.createFromHtml(vfiles, bodySelector));
      }
    });
  }

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
    }, builder);
    this.index = builder.build();
  }

  private getResult(): ISearchIndexResult {
    return {
      index: this.index,
      store: this.store,
    };
  }
}
