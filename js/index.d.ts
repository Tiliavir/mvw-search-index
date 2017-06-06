/// <reference types="vinyl" />
/// <reference types="lunr" />
import * as File from "vinyl";
export interface IFileInformation {
    description: string;
    keywords: string;
    referencedFile: string;
    scope: {
        [filename: string]: any;
    };
    title: string;
}
export interface IFile {
    file: File;
    metadata: IFileInformation;
}
export interface IResultStore {
    [key: string]: {
        title: string;
        description: string;
    };
}
export declare class SearchIndex {
    private store;
    private index;
    constructor(files: IFile[]);
    private add(file, metadata);
    getResult(): {
        index: lunr.Index;
        store: IResultStore;
    };
}
