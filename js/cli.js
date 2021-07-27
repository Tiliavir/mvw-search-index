#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var commander_1 = require("commander");
var fs = require("fs");
var index_1 = require("./index");
commander_1.program
    .version("2.2.8")
    .arguments("<glob> <dest> [bodySelector]")
    .action(function (glob, dest, bodySelector) {
    index_1.SearchIndex.createFromGlob(glob, bodySelector, function (index) {
        return fs.writeFileSync(dest || "./index.json", JSON.stringify(index));
    });
})
    .parse(process.argv);
//# sourceMappingURL=cli.js.map