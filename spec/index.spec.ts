import {IFileInformation, ISearchIndexResult, SearchIndex} from "../ts";
import * as lunr from "lunr";

describe("SearchIndex: test add", () => {
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

    const lnr: lunr.Index = lunr.Index.load(JSON.parse(JSON.stringify(result.index)));
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

    const result: ISearchIndexResult = SearchIndex.createFromHtml([({
      relative: "filename.js",
      contents: Buffer.from(htmlFile)
    })]);

    expect(result.store).toEqual({"filename.js": {description: "test", title: "Hello"}});
    expect(result.index).toBeDefined();

    const lnr: lunr.Index = lunr.Index.load(JSON.parse(JSON.stringify(result.index)));
    const r: lunr.Index.Result[] = lnr.search("World*");
    expect(r.length).toBe(1);
    expect(r[0].ref).toBe("filename.js");
    expect(result.store[r[0].ref].title).toBe("Hello");
  });

  it("tests that files are read and represented in the resulting index", () => {
    const cbObserver = {
      testCallback(result: ISearchIndexResult) {
        expect(result.store).toEqual({
            'demo/foo.html': {
              description: 'This is the description of foo.html that will be indexed and used as a summary ;-)',
              title: 'Foo Title'
            },
            'demo/index.html': {
              description: 'This is the description of the index.html landing page that will be indexed and used as a summary ;-)',
              title: 'Search Page'
            },
            'demo/sub/index.html': {
              description: 'This is the description of sub/index.html that will be indexed and used as a summary ;-)',
              title: 'Sub Page Title'
            }
          }
        );
        expect(result.index).toBeDefined();

        const lnr: lunr.Index = lunr.Index.load(JSON.parse(JSON.stringify(result.index)));

        let r: lunr.Index.Result[] = lnr.search("IAmUnique");
        expect(r.length).toBe(1);
        expect(r[0].ref).toBe("demo/foo.html");
        expect(result.store[r[0].ref].title).toBe("Foo Title");

        r = lnr.search("NotToBeFound");
        expect(r.length).toBe(0);
      }
    }
    spyOn(cbObserver, "testCallback");

    SearchIndex.createFromGlob("demo/**/*.html",
      "body.to-be-indexed",
      (r) => cbObserver.testCallback(r));

    setTimeout(() =>
        expect(cbObserver.testCallback).toHaveBeenCalledTimes(1),
      100);
  });
});
