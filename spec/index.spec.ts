import { IFileInformation, SearchIndex } from "../ts/index";
import * as File from "vinyl";

describe("SearchIndex: test add", () => {
    it("tests that an added item is in the resulting index", () => {
        let index: SearchIndex = new SearchIndex();
        let meta: IFileInformation = {
            "description": "test",
            "keywords": "a, b, c",
            "referencedFile": "filename",
            "scope": {},
            "title": "hello"
        };
        index.add(<File> {"contents": {}}, meta);
        let result = index.getResult();

        expect(result.store).toEqual({ filename: { description: "test", title: "hello" }});
        expect(result.index).toBeDefined();
        expect(result.index.documentStore.length).toBe(1);
    });
});
