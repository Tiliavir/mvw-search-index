#!/usr/bin/env node

import { program } from "commander";
import * as fs from "fs";

import { SearchIndex } from "./index";

program
  .version("2.2.8")
  .arguments("<glob> <dest> [bodySelector]")
  .action(async (glob, dest, bodySelector) => {
    try {
      const index = await SearchIndex.createFromGlob(glob, {bodySelector, logger: console});
      await fs.promises.writeFile(dest, JSON.stringify(index));
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  })
  .parseAsync(process.argv);
