# Lunr Search Index

[![Build State](https://github.com/Tiliavir/mvw-search-index/workflows/Node%20CI/badge.svg)](https://github.com/Tiliavir/mvw-search-index/actions)
[![NPM version](https://img.shields.io/npm/v/mvw-search-index.svg?style=flat)](https://www.npmjs.com/package/mvw-search-index)

## About

Small module to generate a [lunr](http://lunrjs.com/) index with result store.

Can e.g. be used to generate a search index for a static website, generated with hugo, jekyll, gatsby or manually.

## Usage

First you have to install this package, then create the index that you use on e.g. a search page. Find samples for
everything in the following chapters.

### Installation

Use `npm install --save-dev mvw-search-index` to add the dependency to your `package.json`.

### Index creation

There are multiple possibilities to generate the script. Some are demonstrated in the following sub chapters:

- From CLI
- From TypeScript
- From nodejs

#### From CLI

```bash
mvw-search-index <glob> <destination> [css-selector]
```

For example:
```bash
mvw-search-index ./build/**/*.html ./build/index.json
```

Or from an npm script e.g. for a hugo page (has to be executed after page creation, obviously):

```json
{
  "scripts": {
    "index": "mvw-search-index './public/**/*.html' './static/suche/index.json' 'main'"
  }
}
```

#### From TypeScript

```ts
import { SearchIndex } from "mvw-search-index";

let index = SearchIndex.createFromHtml(files, bodySelector);
// or: let index = SearchIndex.createFromInfo(info);
// or: let index = SearchIndex.createFromGlob(glob, bodySelector, cb);

fs.writeFileSync("index.json", JSON.stringify(index));
```

### From node.js

```js
"use strict";

const index = require("mvw-search-index");
const fs = require("fs")

index.SearchIndex.createFromGlob("./build/**/*.html",
                                 "main",
                                 (index) => fs.writeFileSync("./static/suche/index.json",
                                                             JSON.stringify(index)));
```

### Sample usage of the created index

You can run `npm run serve` from this repository to run the sample site contained in [./demo](./demo).

This contains a very basic static website with a search form on the landing page `index.html`.

## Releases

- 2.2.10 updates dependencies
- 2.2.9 gets rid of vinyl and provides a demo application
- 2.1.4 - 2.1.12: dependency update
- 2.1.3: added support of glob on API
- 2.1.1: added CLI
- 2.1.0: renamed `referencedFile` to `href`; allowing to parse HTML files directly
- 2.0: Reason for major release: API break due to update to lunr 2.0.
