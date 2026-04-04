"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const ts_1 = require("../ts");
const lunr = __importStar(require("lunr"));
describe("SearchIndex: test add", () => {
    it("tests that an added item is in the resulting index", () => {
        const meta = [{
                "body": "Hello World!",
                "description": "test",
                "keywords": "a, b, c",
                "href": "filename",
                "title": "Hello"
            }];
        const result = ts_1.SearchIndex.createFromInfo(meta);
        expect(result.store).toEqual({ filename: { description: "test", title: "Hello" } });
        expect(result.index).toBeDefined();
        const lnr = lunr.Index.load(structuredClone(result.index.toJSON()));
        const r = lnr.search("World*");
        expect(r.length).toBe(1);
        expect(r[0].ref).toBe("filename");
        expect(result.store[r[0].ref].title).toBe("Hello");
    });
    it("tests that an added file is in the resulting index", () => {
        const htmlFile = `
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
        const result = ts_1.SearchIndex.createFromHtml([({
                relative: "filename.js",
                contents: Buffer.from(htmlFile)
            })]);
        expect(result.store).toEqual({ "filename.js": { description: "test", title: "Hello" } });
        expect(result.index).toBeDefined();
        const lnr = lunr.Index.load(structuredClone(result.index.toJSON()));
        const r = lnr.search("World*");
        expect(r.length).toBe(1);
        expect(r[0].ref).toBe("filename.js");
        expect(result.store[r[0].ref].title).toBe("Hello");
    });
    it("tests that files are read and represented in the resulting index", () => {
        const cbObserver = {
            testCallback(result) {
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
                });
                expect(result.index).toBeDefined();
                const lnr = lunr.Index.load(structuredClone(result.index.toJSON()));
                let r = lnr.search("IAmUnique");
                expect(r.length).toBe(1);
                expect(r[0].ref).toBe("docs/foo.html");
                expect(result.store[r[0].ref].title).toBe("Foo Title");
                r = lnr.search("NotToBeFound");
                expect(r.length).toBe(0);
            }
        };
        spyOn(cbObserver, "testCallback");
        ts_1.SearchIndex.createFromGlob("docs/**/*.html", "body.to-be-indexed", (r) => cbObserver.testCallback(r));
        setTimeout(() => expect(cbObserver.testCallback).toHaveBeenCalledTimes(1), 100);
    });
});
//# sourceMappingURL=index.spec.js.map