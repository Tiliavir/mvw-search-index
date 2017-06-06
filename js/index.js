"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lunr = require("lunr");
var SearchIndex = (function () {
    function SearchIndex(files) {
        var _this = this;
        this.store = {};
        this.index = lunr(function (idx) {
            idx.field("title");
            idx.field("keywords");
            idx.field("description");
            idx.field("body");
            idx.ref("href");
            files.forEach(function (file) {
                idx.add(_this.add(file.file, file.metadata));
            }, idx);
        });
    }
    SearchIndex.prototype.add = function (file, metadata) {
        var data = file.contents.toString();
        if (metadata.scope.hasOwnProperty(metadata.referencedFile)) {
            data += JSON.stringify(metadata.scope[metadata.referencedFile])
                .replace(/\[|\]|\)|\(|\{|\}|\"|:/g, " ");
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
        return doc;
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