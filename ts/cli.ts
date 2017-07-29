#!/usr/bin/env node

import { SearchIndex } from "./index";
import * as program from "commander";
import * as globber from "glob";
import * as fs from "fs";
import * as File from "vinyl";

let vinylFile: any = require("vinyl-file");

let files: File[] = [];
program.version("2.1.0")
       .arguments("<glob> <dest> [bodySelector]")
       .action((glob, dest, bodySelector) => {
         globber(glob, (err: any, files: string[]): void => {
           if (err) {
             throw err;
           } else {
             let vfiles: File[] = files.map(file => vinylFile.readSync(file));
             fs.writeFileSync(dest || "./index.json", JSON.stringify(SearchIndex.createFromHtml(vfiles, bodySelector)));
           }
         });
       })
       .parse(process.argv);
