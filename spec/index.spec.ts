import {describe, it, expect, vi} from "vitest";
import * as fs from "fs";
import {IFileInformation, ISearchIndexResult, SearchIndex, SearchIndexOptions} from "../ts";
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
    expect(Object.keys(result.store)).toEqual(["docs/foo.html", "docs/index.html", "docs/sub/index.html"]);
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

  it("is silent by default and reports progress to a given logger", async () => {
    const consoleSpy = vi.spyOn(console, "info");
    const messages: string[] = [];
    try {
      await SearchIndex.createFromGlob("docs/foo.html");
      expect(consoleSpy).not.toHaveBeenCalled();

      await SearchIndex.createFromGlob("docs/foo.html", {logger: {info: (m) => messages.push(m), warn: () => undefined}});
      expect(messages).toEqual(["Indexing docs/foo.html"]);
    } finally {
      consoleSpy.mockRestore();
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

function indexHtml(html: string, options?: SearchIndexOptions): lunr.Index {
  const result = SearchIndex.createFromHtml([{relative: "page.html", contents: html}], options);
  return lunr.Index.load(JSON.parse(JSON.stringify(result.index)));
}

function hits(index: lunr.Index, query: string): number {
  return index.search(query).length;
}

describe("text extraction", () => {
  it("separates the text of adjacent block elements", () => {
    const index = indexHtml("<body><ul><li>Trompete</li><li>Posaune</li></ul><h1>Probe</h1><p>Mittwoch<br>Abend</p></body>");
    for (const word of ["Trompete", "Posaune", "Probe", "Mittwoch", "Abend"]) {
      expect(hits(index, word), word).toBe(1);
    }
  });

  it("does not split words that are only broken up by inline markup", () => {
    const index = indexHtml("<body><p><strong>B</strong>lasmusik and <a href='#'>Konzert</a>saal</p></body>");
    expect(hits(index, "Blasmusik")).toBe(1);
    expect(hits(index, "Konzertsaal")).toBe(1);
  });

  it("indexes every element matched by the body selector, separated", () => {
    const index = indexHtml("<body><main>one</main><aside>skip</aside><main>two</main></body>", {bodySelector: "main"});
    expect(hits(index, "one")).toBe(1);
    expect(hits(index, "two")).toBe(1);
    expect(hits(index, "skip")).toBe(0);
  });

  it("never indexes scripts, styles, noscript and template content", () => {
    const index = indexHtml(`<body><p>visible</p>
      <script>var secretFunctionName = 1;</script>
      <style>.fancyClass { color: red }</style>
      <noscript>enablejavascript</noscript>
      <template><p>templatetext</p></template></body>`);
    expect(hits(index, "visible")).toBe(1);
    for (const word of ["secretFunctionName", "fancyClass", "enablejavascript", "templatetext"]) {
      expect(hits(index, word), word).toBe(0);
    }
  });

  it("excludes nav and footer by default", () => {
    const html = "<body><nav>Impressum</nav><main>Jahreskonzert</main><footer>Datenschutz</footer></body>";
    const index = indexHtml(html);
    expect(hits(index, "Jahreskonzert")).toBe(1);
    expect(hits(index, "Impressum")).toBe(0);
    expect(hits(index, "Datenschutz")).toBe(0);
  });

  it("supports a custom exclude selector, or none", () => {
    const html = "<body><nav>Impressum</nav><main>Jahreskonzert <span class='ad'>Werbung</span></main></body>";
    const custom = indexHtml(html, {excludeSelector: ".ad"});
    expect(hits(custom, "Werbung")).toBe(0);
    expect(hits(custom, "Impressum")).toBe(1);

    const none = indexHtml(html, {excludeSelector: ""});
    expect(hits(none, "Werbung")).toBe(1);
    expect(hits(none, "Impressum")).toBe(1);
  });

  it("still indexes a body selector that matches the exclude selector itself", () => {
    const index = indexHtml("<body><footer>Kontakt</footer></body>", {bodySelector: "footer"});
    expect(hits(index, "Kontakt")).toBe(1);
  });
});
