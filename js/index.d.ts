/// <reference types="vinyl" />
/// <reference types="lunr" />
import * as File from "vinyl";
export interface IResultStore {
    [key: string]: {
        title: string;
        description: string;
    };
}
export interface IFileInformation {
    body: string;
    description: string;
    href: string;
    keywords: string;
    title: string;
}
export interface IHtmlFileList {
    list: File[];
    bodySelector?: string;
}
export interface ISearchIndexResult {
    index: lunr.Index;
    store: IResultStore;
}
export declare class SearchIndex {
    private store;
    private index;
    private constructor();
    static createFromInfo(files: IFileInformation[]): ISearchIndexResult;
    static createFromHtml(files: File[], bodySelector?: string): ISearchIndexResult;
    static createFromGlob(glob: string, bodySelector: string, cb: (index: ISearchIndexResult) => void): void;
    private getResult();
}
