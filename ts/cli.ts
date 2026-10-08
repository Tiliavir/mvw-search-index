#!/usr/bin/env node

import { program } from "commander";
import * as fs from "fs";

import { SearchIndex } from "./index";

program
  .version("2.2.8")
  .arguments("<glob> <dest> [bodySelector]")
  .action((glob, dest, bodySelector) => {
    SearchIndex.createFromGlob(glob, bodySelector, (index) =>
      fs.writeFileSync(dest, JSON.stringify(index)),
    );
  })
  .parse(process.argv);
