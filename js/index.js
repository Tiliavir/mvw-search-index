"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cheerio = require("cheerio");
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
            files.forEach(function (info) {
                _this.store[info.href] = {
                    description: info.description,
                    title: info.title
                };
                idx.add(info);
            }, idx);
        });
    }
    SearchIndex.createFromInfo = function (files) {
        return new SearchIndex(files).getResult();
    };
    SearchIndex.createFromHtml = function (files, bodySelector) {
        if (bodySelector === void 0) { bodySelector = "body"; }
        var infos = files.map(function (file) {
            var dom = cheerio.load(file.contents.toString());
            var info = {
                body: dom(bodySelector || "body").each(function (elem) {
                    cheerio(elem).append(" ");
                }).text().replace(/\s\s+/g, " "),
                description: dom("meta[name='description']").attr("content"),
                href: file.stem,
                keywords: dom("meta[name='keywords']").attr("content"),
                title: dom("title").text()
            };
            return info;
        });
        return SearchIndex.createFromInfo(infos);
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