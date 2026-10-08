#!/usr/bin/env node

import {InvalidArgumentError, program} from "commander";
import * as fs from "fs";
import * as path from "path";

import {DEFAULT_EXCLUDE_SELECTOR, DEFAULT_LANGUAGE, Logger, SearchField, SearchIndex, SearchIndexOptions} from "./index";

// read at runtime: package.json is outside of the compiled sources
const {version} = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));

const FIELDS: SearchField[] = ["title", "keywords", "description", "body"];

function parseBoost(value: string, previous: Partial<Record<SearchField, number>> = {}): Partial<Record<SearchField, number>> {
  const match = /^(\w+)=(\d+(?:\.\d+)?)$/.exec(value);
  if (!match || !FIELDS.includes(match[1] as SearchField)) {
    throw new InvalidArgumentError(`Expected <field>=<number> with field one of ${FIELDS.join(", ")}.`);
  }
  return {...previous, [match[1]]: Number(match[2])};
}

interface CliOptions {
  cwd?: string;
  exclude: string;
  language: string;
  baseUrl?: string;
  stripIndexHtml?: boolean;
  noindex: boolean;
  allowEmpty?: boolean;
  boost?: Partial<Record<SearchField, number>>;
  verbose?: boolean;
}

program
  .name("mvw-search-index")
  .description("Generates a lunr search index and result store from HTML files.")
  .version(version)
  .argument("<glob>", "glob pattern of the HTML files to index (quote it, so your shell doesn't expand it)")
  .argument("<dest>", "path of the JSON file to write")
  .argument("[bodySelector]", "CSS selector of the content to index", "body")
  .option("--cwd <dir>", "directory to resolve <glob> in; hrefs are relative to it (use your site's root)")
  .option("-e, --exclude <selector>", "CSS selector of content to leave out (\"\" for none)", DEFAULT_EXCLUDE_SELECTOR)
  .option("-l, --language <code>", "two-letter content language, selects stemmer and stop words", DEFAULT_LANGUAGE)
  .option("--base-url <url>", "prefix for all hrefs, e.g. \"/\"")
  .option("--strip-index-html", "link to \"dir/\" instead of \"dir/index.html\"")
  .option("--no-noindex", "also index pages marked <meta name=\"robots\" content=\"noindex\">")
  .option("--allow-empty", "write an empty index instead of failing if <glob> matches no files")
  .option("-b, --boost <field=number>", "weight of a field, repeatable (default title=5 keywords=3 description=2 body=1)",
    parseBoost)
  .option("-v, --verbose", "list every indexed file")
  .showHelpAfterError()
  .action(async (glob: string, dest: string, bodySelector: string, cli: CliOptions) => {
    const logger: Logger = {
      info: (message) => cli.verbose && console.log(message),
      warn: (message) => console.warn(`Warning: ${message}`),
    };
    const options: SearchIndexOptions = {
      bodySelector,
      excludeSelector: cli.exclude,
      language: cli.language,
      cwd: cli.cwd,
      baseUrl: cli.baseUrl,
      stripIndexHtml: cli.stripIndexHtml,
      respectNoindex: cli.noindex,
      allowEmpty: cli.allowEmpty,
      boosts: cli.boost,
      logger,
    };
    try {
      const index = await SearchIndex.createFromGlob(glob, options);
      await fs.promises.mkdir(path.dirname(path.resolve(dest)), {recursive: true});
      await fs.promises.writeFile(dest, JSON.stringify(index));
      console.log(`Indexed ${Object.keys(index.store).length} page(s) into ${dest}`);
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : err}`);
      process.exitCode = 1;
    }
  })
  .parseAsync(process.argv);
