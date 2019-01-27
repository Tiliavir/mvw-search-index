#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var program = require("commander");
var fs = require("fs");
var index_1 = require("./index");
program
    .version("2.1.3")
    .arguments("<glob> <dest> [bodySelector]")
    .action(function (glob, dest, bodySelector) {
    index_1.SearchIndex.createFromGlob(glob, bodySelector, function (index) {
        return fs.writeFileSync(dest || "./index.json", JSON.stringify(index));
    });
})
    .parse(process.argv);
//# sourceMappingURL=cli.js.map