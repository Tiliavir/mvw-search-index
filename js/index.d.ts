import * as lunr from "lunr";
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
declare interface ReadFileWithContents {
    contents: Buffer;
    relative: string;
}
export declare class SearchIndex {
    private readonly store;
    private readonly index;
    private constructor();
    static createFromInfo(files: IFileInformation[]): ISearchIndexResult;
    static createFromHtml(files: ReadFileWithContents[], bodySelector?: string): ISearchIndexResult;
    static createFromGlob(pattern: string, bodySelector: string, cb: (index: ISearchIndexResult) => void): void;
    private getResult;
}
export {};
