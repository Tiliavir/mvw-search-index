#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var program = require("commander");
var globber = require("glob");
var fs = require("fs");
var vinylFile = require("vinyl-file");
var files = [];
program.version("2.1.0")
    .arguments("<glob> <dest> [bodySelector]")
    .action(function (glob, dest, bodySelector) {
    globber(glob, function (err, files) {
        if (err) {
            throw err;
        }
        else {
            var vfiles = files.map(function (file) { return vinylFile.readSync(file); });
            fs.writeFileSync(dest || "./index.json", JSON.stringify(index_1.SearchIndex.createFromHtml(vfiles, bodySelector)));
        }
    });
})
    .parse(process.argv);
//# sourceMappingURL=cli.js.map