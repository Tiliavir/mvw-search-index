#!/usr/bin/env node

import * as program from "commander";
import * as fs from "fs";

import { SearchIndex } from "./index";

program
  .version("2.1.3")
  .arguments("<glob> <dest> [bodySelector]")
  .action((glob, dest, bodySelector) => {
    SearchIndex.createFromGlob(glob, bodySelector, (index) =>
      fs.writeFileSync(dest || "./index.json", JSON.stringify(index)),
    );
  })
  .parse(process.argv);
