#!/usr/bin/env node

import { SearchIndex } from "./index";
import * as program from "commander";
import * as fs from "fs";

let files: File[] = [];
program.version("2.1.3")
       .arguments("<glob> <dest> [bodySelector]")
       .action((glob, dest, bodySelector) => {
         SearchIndex.createFromGlob(glob, bodySelector, (index) => fs.writeFileSync(dest || "./index.json", JSON.stringify(index)));
       })
       .parse(process.argv);
