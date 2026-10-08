#!/usr/bin/env node

import { program } from "commander";
import * as fs from "fs";
import * as path from "path";

import { SearchIndex } from "./index";

// read at runtime: package.json is outside of the compiled sources
const {version} = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));

program
  .version(version)
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
