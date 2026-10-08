import {describe, it, expect, vi} from "vitest";
import * as fs from "fs";
import {IFileInformation, ISearchIndexResult, SearchIndex} from "../ts";
import * as lunr from "lunr";

describe("SearchIndex", () => {
  it("tests that an added item is in the resulting index", () => {
    const meta: IFileInformation[] = [{
      "body": "Hello World!",
      "description": "test",
      "keywords": "a, b, c",
      "href": "filename",
      "title": "Hello"
    }];
    const result: ISearchIndexResult = SearchIndex.createFromInfo(meta);

    expect(result.store).toEqual({filename: {description: "test", title: "Hello"}});
    expect(result.index).toBeDefined();

    const lnr: lunr.Index = lunr.Index.load(JSON.parse(JSON.stringify(result.index.toJSON())));
    const r: lunr.Index.Result[] = lnr.search("World*");
    expect(r.length).toBe(1);
    expect(r[0].ref).toBe("filename");
    expect(result.store[r[0].ref].title).toBe("Hello");
  });

  it("tests that an added file is in the resulting index", () => {
    const htmlFile: string = `
           <html lang="de">
           <head>
               <title>Hello</title>
               <meta name="description" content="test" />
               <meta name="keywords" content="a, b, c" />
           </head>
           <body>
               Hello World!
           </body>
           </html>
           `;

    const result: ISearchIndexResult = SearchIndex.createFromHtml([{
      relative: "filename.js",
      contents: Buffer.from(htmlFile)
    }]);

    expect(result.store).toEqual({"filename.js": {description: "test", title: "Hello"}});
    expect(result.index).toBeDefined();

    const lnr: lunr.Index = lunr.Index.load(JSON.parse(JSON.stringify(result.index.toJSON())));
    const r: lunr.Index.Result[] = lnr.search("World*");
    expect(r.length).toBe(1);
    expect(r[0].ref).toBe("filename.js");
    expect(result.store[r[0].ref].title).toBe("Hello");
  });

  it("tests that files are read and represented in the resulting index", async () => {
    const result: ISearchIndexResult = await SearchIndex.createFromGlob("docs/**/*.html", "body.to-be-indexed");
    expect(result.store).toEqual({
        'docs/foo.html': {
          description: 'This is the description of foo.html that will be indexed and used as a summary ;-)',
          title: 'Foo Title'
        },
        'docs/index.html': {
          description: 'This is the description of the index.html landing page that will be indexed and used as a summary ;-)',
          title: 'Search Page'
        },
        'docs/sub/index.html': {
          description: 'This is the description of sub/index.html that will be indexed and used as a summary ;-)',
          title: 'Sub Page Title'
        }
      }
    );
    expect(result.index).toBeDefined();

    const lnr: lunr.Index = lunr.Index.load(JSON.parse(JSON.stringify(result.index.toJSON())));

    let r: lunr.Index.Result[] = lnr.search("IAmUnique");
    expect(r.length).toBe(1);
    expect(r[0].ref).toBe("docs/foo.html");
    expect(result.store[r[0].ref].title).toBe("Foo Title");

    r = lnr.search("NotToBeFound");
    expect(r.length).toBe(0);
  });

  it("rejects when a matched file cannot be read", async () => {
    const spy = vi.spyOn(fs.promises, "readFile").mockRejectedValueOnce(new Error("EACCES: permission denied"));
    try {
      await expect(SearchIndex.createFromGlob("docs/**/*.html")).rejects.toThrow("EACCES");
    } finally {
      spy.mockRestore();
    }
  });

  it("rejects when the pattern matches no files", async () => {
    await expect(SearchIndex.createFromGlob("does-not-exist/**/*.html")).rejects.toThrow(/No files match/);
  });

  it("creates an empty index for no matches when allowEmpty is set", async () => {
    const result = await SearchIndex.createFromGlob("does-not-exist/**/*.html", {allowEmpty: true});
    expect(result.store).toEqual({});
  });

  it("throws a helpful error when called with a 2.x style callback", () => {
    const legacy = SearchIndex.createFromGlob as unknown as (p: string, s: string, cb: () => void) => unknown;
    expect(() => legacy("docs/**/*.html", "body", () => undefined)).toThrow(/no longer accepts a callback/);
  });

  it("accepts an options object and string contents", () => {
    const result: ISearchIndexResult = SearchIndex.createFromHtml([{
      relative: "a.html",
      contents: "<html><head><title>A</title></head><body><main>inside</main><p>outside</p></body></html>",
    }], {bodySelector: "main"});

    const lnr = lunr.Index.load(JSON.parse(JSON.stringify(result.index)));
    expect(lnr.search("inside").length).toBe(1);
    expect(lnr.search("outside").length).toBe(0);
  });
});
