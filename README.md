# mvw-search-index

[![Build State](https://github.com/Tiliavir/mvw-search-index/workflows/Node%20CI/badge.svg)](https://github.com/Tiliavir/mvw-search-index/actions)
[![NPM version](https://img.shields.io/npm/v/mvw-search-index.svg?style=flat)](https://www.npmjs.com/package/mvw-search-index)
[![license](https://img.shields.io/npm/l/mvw-search-index.svg)](https://github.com/Tiliavir/mvw-search-index/blob/main/LICENSE)

---

## About

**mvw-search-index** generates a [lunr](https://lunrjs.com/) search index plus a result store from the HTML
files of a static website - built with Hugo, Jekyll, Gatsby, or by hand. The generated JSON file is loaded by
the browser, which then searches entirely client-side.

> **Upgrading from 2.x?** Version 3 changes the API, the CLI and what ends up in the index.
> See the [upgrade guide](UPGRADING.md).

---

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [CLI](#cli)
  - [Node.js / TypeScript](#nodejs--typescript)
  - [Options](#options)
- [Searching in the browser](#searching-in-the-browser)
  - [Content in other languages](#content-in-other-languages)
- [What gets indexed](#what-gets-indexed)
- [Demo](#demo)
- [Releases](#releases)

---

## Installation

Requires Node.js 22.12 or newer.

```bash
npm install --save-dev mvw-search-index
```

---

## Usage

Run the indexer **after** your site has been built, on the generated HTML.

### CLI

```bash
mvw-search-index [options] <glob> <dest> [bodySelector]
```

Example - index everything in `public/`, but only the content of `<main>`, with German stemming and
root-relative links:

```bash
mvw-search-index '**/*.html' public/suche/index.json main --cwd public --base-url / --language de
```

Quote the glob so your shell doesn't expand it. From an npm script:

```json
{
  "scripts": {
    "index": "mvw-search-index '**/*.html' public/suche/index.json main --cwd public --base-url /"
  }
}
```

| Flag                         | Option            | Description                                                                 |
|------------------------------|-------------------|-----------------------------------------------------------------------------|
| `[bodySelector]`             | `bodySelector`    | CSS selector of the content to index (default `body`)                       |
| `--cwd <dir>`                | `cwd`             | Directory the glob is resolved in; hrefs are relative to it                 |
| `-e, --exclude <selector>`   | `excludeSelector` | Content to leave out (default `"nav, footer"`, `""` for none)               |
| `-l, --language <code>`      | `language`        | Content language: stop words and stemmer (default `en`)                     |
| `--base-url <url>`           | `baseUrl`         | Prefix for every href, e.g. `/`                                             |
| `--strip-index-html`         | `stripIndexHtml`  | Link to `dir/` instead of `dir/index.html`                                  |
| `--no-noindex`               | `respectNoindex`  | Also index pages marked `<meta name="robots" content="noindex">`            |
| `--allow-empty`              | `allowEmpty`      | Write an empty index instead of failing when the glob matches nothing       |
| `-b, --boost <field=number>` | `boosts`          | Field weight, repeatable, e.g. `-b title=10 -b body=1`                      |
| `-v, --verbose`              | `logger`          | List every indexed file                                                     |

The CLI exits with code 1 and prints `Error: …` if indexing fails, including when the glob matches no files.

### Node.js / TypeScript

```ts
import {writeFile} from "fs/promises";
import {SearchIndex} from "mvw-search-index";

const result = await SearchIndex.createFromGlob("**/*.html", {
  cwd: "public",
  bodySelector: "main",
  language: "de",
  baseUrl: "/",
});
await writeFile("public/suche/index.json", JSON.stringify(result));
```

CommonJS works the same way: `const {SearchIndex} = require("mvw-search-index");`.

There are three entry points:

| Method                                   | Input                                                            | Returns                       |
|------------------------------------------|------------------------------------------------------------------|-------------------------------|
| `createFromGlob(pattern, options?)`      | A glob pattern; files are read from disk                         | `Promise<ISearchIndexResult>` |
| `createFromHtml(files, options?)`        | `HtmlFile[]` - `{relative: string, contents: string \| Buffer}` | `ISearchIndexResult`          |
| `createFromInfo(files, options?)`        | `IFileInformation[]` - already extracted title/body/…            | `ISearchIndexResult`          |

`ISearchIndexResult` is `{index: lunr.Index, store: {[href]: {title, description?}}}`. `JSON.stringify()` it to
get the file the browser loads.

### Options

| Option            | Default                                          | Applies to         | Description                                                                                                                   |
|-------------------|--------------------------------------------------|--------------------|-------------------------------------------------------------------------------------------------------------------------------|
| `bodySelector`    | `"body"`                                         | Glob, HTML         | CSS selector of the element(s) whose text is indexed                                                                          |
| `excludeSelector` | `"nav, footer"`                                  | Glob, HTML         | Elements inside the body to leave out; `""` for none                                                                          |
| `respectNoindex`  | `true`                                           | Glob, HTML         | Skip pages with `<meta name="robots" content="noindex">`                                                                      |
| `language`        | `"en"`                                           | all                | Two-letter language code; other than `en` uses [lunr-languages](https://github.com/MihaiValentin/lunr-languages) (see below) |
| `boosts`          | `{title: 5, keywords: 3, description: 2, body: 1}` | all              | Relative weight of matches per field                                                                                          |
| `cwd`             | `process.cwd()`                                  | Glob               | Directory the pattern is resolved in; hrefs are relative to it                                                                |
| `allowEmpty`      | `false`                                          | Glob               | Resolve with an empty index instead of rejecting when nothing matches                                                         |
| `baseUrl`         | `""`                                             | Glob, HTML         | Prefix for every href                                                                                                         |
| `stripIndexHtml`  | `false`                                          | Glob, HTML         | `foo/index.html` → `foo/`                                                                                                     |
| `logger`          | silent                                           | Glob, HTML         | Receives progress (`info`) and warnings (`warn`); `console` works                                                             |

---

## Searching in the browser

Load lunr (2.3.x) and the generated file, then query it. Building the query with lunr's query API - rather than
passing user input to `index.search()` - means no input can cause a `QueryParseError`, and every word is matched
both as a whole (stemmed) and as a prefix, so results appear while typing:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/lunr.js/2.3.9/lunr.min.js"></script>
<script type="module">
  const {index: serializedIndex, store} = await (await fetch("/suche/index.json")).json();
  const index = lunr.Index.load(serializedIndex);

  function search(input) {
    const terms = lunr.tokenizer(input)
      .map((token) => lunr.trimmer(token).toString())
      .filter((term) => term.length > 0);
    if (terms.length === 0) {
      return [];
    }
    return index.query((query) => {
      for (const term of terms) {
        query.term(term, {boost: 10}); // whole word, stemmed like the index
        query.term(term, {usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING}); // prefix
      }
    }).map((result) => ({href: result.ref, ...store[result.ref]}));
  }
</script>
```

Render the `title` and `description` with `textContent` (not `innerHTML`). [docs/index.html](docs/index.html) is a
complete, working example.

### Content in other languages

With `language` set to anything other than `en`, the index references that language's lunr-languages pipeline
functions. Load the matching scripts after lunr and **before** `lunr.Index.load()` - otherwise lunr throws
`Cannot load unregistered function: trimmer-de`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/lunr.js/2.3.9/lunr.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lunr-languages@1.22.0/lunr.stemmer.support.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lunr-languages@1.22.0/lunr.de.js"></script>
```

Use `lunr.de.trimmer` instead of `lunr.trimmer` in the `search()` function above, so umlauts at word boundaries are
kept.

---

## What gets indexed

For every page:

- **title**: `<title>`, falling back to `og:title`, then the first `<h1>`
- **description**: `<meta name="description">`, falling back to `og:description`
- **keywords**: `<meta name="keywords">` (comma separated)
- **body**: the text of `bodySelector`, without `excludeSelector` matches, `<script>`, `<style>`, `<noscript>` and
  `<template>`; words in separate block elements stay separate words

Title and description also go into the result store, keyed by href. Text runs through lunr's pipeline for the
configured language: punctuation is trimmed, stop words are dropped and words are stemmed.

Pages with `<meta name="robots" content="noindex">` are skipped.

---

## Demo

A basic sample site is included and served from [GitHub Pages](https://tiliavir.github.io/mvw-search-index/).

Start it locally with:

```bash
npm run serve
```

This rebuilds `docs/index.json` and serves [./docs](docs): a simple static site with a search form on `index.html`.

---

## Releases

- **3.0.0**: Major overhaul - Promise based API, correct text extraction and lunr pipeline (stemming, stop words),
  language support, field boosts, href options, a full-featured CLI. **Breaking** - see [UPGRADING.md](UPGRADING.md).
- **2.3.2 – 2.3.7**: Dependency updates.
- **2.3.0**: Added attribute support for metadata extraction.
- **2.2.10 - 2.2.16**: Dependency updates.
- **2.2.9**: Removed `vinyl`; introduced demo application.
- **2.1.4 – 2.1.12**: Dependency updates.
- **2.1.3**: Added glob pattern support to the API.
- **2.1.1**: Introduced CLI.
- **2.1.0**: Renamed `referencedFile` to `href`; added direct HTML file parsing.
- **2.0.0**: **Breaking change** — updated to lunr 2.0.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Author

Maintained by [Tiliavir](https://github.com/Tiliavir).
