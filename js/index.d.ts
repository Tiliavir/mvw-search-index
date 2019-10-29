/// <reference types="lunr" />
import * as File from "vinyl";
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
export declare interface ISearchIndexResult {
    index: lunr.Index;
    store: IResultStore;
}
export declare class SearchIndex {
    static createFromInfo(files: IFileInformation[]): ISearchIndexResult;
    static createFromHtml(files: File[], bodySelector?: string): ISearchIndexResult;
    static createFromGlob(glob: string, bodySelector: string, cb: (index: ISearchIndexResult) => void): void;
    private store;
    private index;
    private constructor();
    private getResult;
}
