"use strict";
var lunr = require("lunr");
var SearchIndex = (function () {
    function SearchIndex() {
        this.store = {};
        this.index = lunr(function (idx) {
            idx.field("title", { boost: 10 });
            idx.field("keywords", { boost: 6 });
            idx.field("description", { boost: 3 });
            idx.field("body");
            idx.ref("href");
        });
    }
    SearchIndex.prototype.add = function (file, metadata) {
        var data = file.contents.toString();
        if (metadata.scope.hasOwnProperty(metadata.referencedFile)) {
            data += JSON.stringify(metadata.scope[metadata.referencedFile]).replace(/\[|\]|\)|\(|\{|\}|\"|:/g, " ");
        }
        var doc = {
            body: data,
            description: metadata.description,
            href: metadata.referencedFile,
            keywords: metadata.keywords,
            title: metadata.title
        };
        this.store[doc.href] = {
            description: doc.description,
            title: doc.title
        };
        this.index.add(doc);
    };
    SearchIndex.prototype.getResult = function () {
        return {
            index: this.index,
            store: this.store
        };
    };
    return SearchIndex;
}());
exports.SearchIndex = SearchIndex;
//# sourceMappingURL=index.js.map