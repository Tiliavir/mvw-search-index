import * as fs from "fs";
import * as File from "vinyl";
import * as cheerio from "cheerio";

let lunr: any = require ("lunr");

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

export declare interface IHtmlFileList {
  list: File[];
  bodySelector?: string;
}

export class SearchIndex {
  private store: IResultStore;
  private index: lunr.Index;

  private constructor(files: IFileInformation[]) {
    this.store = {};
    this.index = lunr((idx: lunr.Index) => {
      idx.field("title");
      idx.field("keywords");
      idx.field("description");
      idx.field("body");
      idx.ref("href");

      files.forEach((info: IFileInformation): void => {
        this.store[info.href] = {
          description: info.description,
          title: info.title
        };
        idx.add(info);
      }, idx);
    });
  }

  public static createFromInfo(files: IFileInformation[]): {index: lunr.Index, store: IResultStore} {
    return new SearchIndex(files).getResult();
  }

  public static createFromHtml(files: File[], bodySelector: string = "body"): {index: lunr.Index, store: IResultStore} {
    let infos: IFileInformation[] = files.map((file) => {
      let dom: CheerioStatic = cheerio.load(file.contents.toString());
      let info: IFileInformation = {
        body: dom(bodySelector || "body").each((elem) => {
          cheerio(elem).append(" ");
        }).text().replace(/\s\s+/g, " "),
        description: dom("meta[name='description']").attr("content"),
        href: file.stem,
        keywords: dom("meta[name='keywords']").attr("content"),
        title: dom("title").text()
      };
      return info;
    });

    return SearchIndex.createFromInfo(infos);
  }

  private getResult(): {index: lunr.Index, store: IResultStore} {
    return {
      index: this.index,
      store: this.store
    };
  }
}
