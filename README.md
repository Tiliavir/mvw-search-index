# mvw-search-index

[![Build State](https://github.com/Tiliavir/mvw-search-index/workflows/Node%20CI/badge.svg)](https://github.com/Tiliavir/mvw-search-index/actions)
[![NPM version](https://img.shields.io/npm/v/mvw-search-index.svg?style=flat)](https://www.npmjs.com/package/mvw-search-index)
[![license](https://img.shields.io/npm/l/mvw-search-index.svg)](https://github.com/Tiliavir/mvw-search-index/blob/main/LICENSE)

---

## About

**mvw-search-index** is a lightweight tool for generating a [lunr](http://lunrjs.com/) search index with a result store.

It is ideal for adding fast client-side search capabilities to static websites — whether built with Hugo, Jekyll, Gatsby, or even manually.

---

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [From CLI](#from-cli)
  - [From TypeScript](#from-typescript)
  - [From Node.js](#from-nodejs)
- [Demo](#demo)
- [Releases](#releases)

---

## Installation

Add the package to your project:

```bash
npm install --save-dev mvw-search-index
```

---

## Usage

You can create an index using the command-line interface, directly from TypeScript, or through Node.js.

### From CLI

```bash
mvw-search-index <glob> <destination> [css-selector]
```

Example:

```bash
mvw-search-index ./build/**/*.html ./build/index.json
```

Or from an npm script:

```json
{
  "scripts": {
    "index": "mvw-search-index './public/**/*.html' './static/suche/index.json' 'main'"
  }
}
```

> Ensure the indexing step runs after the site is built.

### From TypeScript

```ts
import { SearchIndex } from "mvw-search-index";
import * as fs from "fs";

const index = SearchIndex.createFromHtml(files, bodySelector);
// Alternatives:
// const index = SearchIndex.createFromInfo(info);
// const index = SearchIndex.createFromGlob(glob, bodySelector, callback);

fs.writeFileSync("index.json", JSON.stringify(index));
```

### From Node.js

```js
"use strict";

const { SearchIndex } = require("mvw-search-index");
const fs = require("fs");

SearchIndex.createFromGlob("./build/**/*.html", "main", (index) => {
  fs.writeFileSync("./static/suche/index.json", JSON.stringify(index));
});
```

---

## Demo

A basic sample site is included and served from [GitHub Pages](https://tiliavir.github.io/mvw-search-index/).

Start it locally with:

```bash
npm run serve
```

This serves the content from [./docs](docs), featuring a simple static site with a search form on `index.html`.

---

## Releases

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

---
