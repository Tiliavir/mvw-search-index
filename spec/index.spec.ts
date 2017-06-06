import { IFileInformation, IFile, SearchIndex } from "../ts/index";
import * as File from "vinyl";

describe("SearchIndex: test add", () => {
    it("tests that an added item is in the resulting index", () => {
        let meta: IFileInformation = {
            "description": "test",
            "keywords": "a, b, c",
            "referencedFile": "filename",
            "scope": {},
            "title": "hello"
        };
        let files: IFile[] = [{file: <File> {"contents": {}}, metadata: meta}];
        let index: SearchIndex = new SearchIndex(files);
        let result = index.getResult();

        expect(result.store).toEqual({ filename: { description: "test", title: "hello" }});
        expect(result.index).toBeDefined();
        expect((<any> result.index).documentCount).toBe(1);
    });
});
