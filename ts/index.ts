import * as fs from "fs";
import * as File from "vinyl";

let lunr: any = require ("lunr");

export declare interface IFileInformation {
  description: string;
  keywords: string;
  referencedFile: string;
  scope: { [filename: string]: any };
  title: string;
}

declare interface ISearchIndexDocument {
  body: string;
  description: string;
  href: string;
  keywords: string;
  title: string;
}

export declare interface IResultStore {
  [key: string]: {
    title: string;
    description: string;
  };
}

export class SearchIndex {
  private store: IResultStore;
  private index: lunr.Index;

  public constructor() {
    this.store = {};
    this.index = lunr((idx: lunr.Index) => {
      idx.field("title", { boost: 10 });
      idx.field("keywords", { boost: 6 });
      idx.field("description", { boost: 3 });
      idx.field("body");
      idx.ref("href");
    });
  }

  public add(file: File, metadata: IFileInformation): void {
    let data: string = file.contents.toString();
    if (metadata.scope.hasOwnProperty(metadata.referencedFile)) {
      data += JSON.stringify(metadata.scope[metadata.referencedFile]).replace(/\[|\]|\)|\(|\{|\}|\"|:/g, " ");
    }

    let doc: ISearchIndexDocument = {
      body: data,
      description: metadata.description,
      href: metadata.referencedFile,
      keywords: metadata.keywords,
      title: metadata.title
    };

    this.store[doc.href] = {
      description: doc.description,
      title: doc.title
    };

    this.index.add(doc);
  }

  public getResult(): {index: lunr.Index, store: IResultStore} {
    return {
      index: this.index,
      store: this.store
    };
  }
}
