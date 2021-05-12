"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchIndex = void 0;
var cheerio = require("cheerio");
var globber = require("glob");
var vinylFile = require("vinyl-file");
var lunr = require("lunr");
var SearchIndex = /** @class */ (function () {
    function SearchIndex(files) {
        var _this = this;
        this.store = {};
        var builder = new lunr.Builder();
        builder.field("title");
        builder.field("keywords");
        builder.field("description");
        builder.field("body");
        builder.ref("href");
        files.forEach(function (info) {
            _this.store[info.href] = {
                description: info.description,
                title: info.title,
            };
            builder.add(info);
        }, builder);
        this.index = builder.build();
    }
    SearchIndex.createFromInfo = function (files) {
        return new SearchIndex(files).getResult();
    };
    SearchIndex.createFromHtml = function (files, bodySelector) {
        if (bodySelector === void 0) { bodySelector = "body"; }
        var infos = files.map(function (file) {
            console.info(file.relative);
            var dom = cheerio.load(file.contents.toString());
            return {
                body: dom(bodySelector || "body").text().replace(/\s\s+/g, " "),
                description: dom("meta[name='description']").attr("content"),
                href: file.relative,
                keywords: dom("meta[name='keywords']").attr("content"),
                title: dom("head title").text(),
            };
        });
        return SearchIndex.createFromInfo(infos);
    };
    SearchIndex.createFromGlob = function (glob, bodySelector, cb) {
        globber(glob, function (err, files) {
            if (err) {
                throw err;
            }
            else {
                var vfiles = files.map(function (file) { return vinylFile.readSync(file); });
                cb(SearchIndex.createFromHtml(vfiles, bodySelector));
            }
        });
    };
    SearchIndex.prototype.getResult = function () {
        return {
            index: this.index,
            store: this.store,
        };
    };
    return SearchIndex;
}());
exports.SearchIndex = SearchIndex;
//# sourceMappingURL=index.js.map