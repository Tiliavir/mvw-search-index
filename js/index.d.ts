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
export declare class SearchIndex {
    private store;
    private index;
    private constructor(files);
    static createFromInfo(files: IFileInformation[]): {
        index: lunr.Index;
        store: IResultStore;
    };
    static createFromHtml(files: File[], bodySelector?: string): {
        index: lunr.Index;
        store: IResultStore;
    };
    private getResult();
}
