# Lunr Search Index

[![Build State](https://github.com/Tiliavir/mvw-search-index/workflows/Node%20CI/badge.svg)](https://github.com/Tiliavir/mvw-search-index/actions)
[![NPM version](https://img.shields.io/npm/v/mvw-search-index.svg?style=flat)](https://www.npmjs.com/package/mvw-search-index)

## About
Small module to generate a [lunr](http://lunrjs.com/) index with result store.

Can e.g. be used to generate a search index for a static website, generated with hugo, jekyll,  gatsby or manually.

## Usage
First you have to install this package, the create the index that you than use on e.g. a search page.
Find samples for everything in the following chapters.

### Installation
Use `npm install --save-dev mvw-search-index` to add the dependency to your `package.json`.

### Index creation
There are multiple possibilities to generate the script. Some are demonstrated in the following sub chapters:
- From CLI
- From TypeScript
- From nodejs

#### From CLI
`mvw-search-index <glob> <destination> [css-selector]`

Foe example:
`mvw-search-index ./build/**/*.html ./build/index.json`

Or from an npm script e.g. for a hugo page (has to be executed after page creation, obviously):

```json
{
  "scripts": {
    "index": "mvw-search-index './public/**/*.html' './static/suche/index.json' 'main'"
  }
}
```

#### From TypeSript
``` ts
import { SearchIndex } from "mvw-search-index";
// ...
let index = SearchIndex.createFromHtml(files, bodySelector);
// or: let index = SearchIndex.createFromInfo(info);
// or: let index = SearchIndex.createFromGlob(glob, bodySelector, cb);
fs.writeFileSync("index.json", JSON.stringify(index));
```

### From nodejs
```js
"use strict";

const index = require("mvw-search-index");
const fs = require("fs")

index.SearchIndex.createFromGlob("./build/**/*.html",
    "main",
    (index) => fs.writeFileSync("./static/suche/index.json", JSON.stringify(index)));
```

### Sample usage of the created `index.json`

```html
<!DOCTYPE html>

<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta content="IE=edge" http-equiv="X-UA-Compatible">
    <meta content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" name="viewport">
    <title>Suche</title>
    <style>
      form {
        text-align: center
      }

      .mvw-search-field {
        font-size: 3rem;
        margin: 15px 0 40px;
        max-width: 100%
      }

      .results {
        padding-left: 0
      }

      .results li {
        list-style: none
      }

      .results a:first-of-type {
        display: block;
        font-size: 2.2rem;
        padding: 15px 0 2px
      }
    </style>
  </head>

  <body itemscope itemtype="http://schema.org/SearchResultsPage">
    <h1 class="page-header">Suche</h1>

    <div>
      <form itemprop="potentialAction" itemscope itemtype="http://schema.org/SearchAction">
        <meta content="search.html?q={query}" itemprop="target">
        <input class="mvw-search-field" itemprop="query-input" name="query" placeholder="Suche..." type="search">
      </form>

      <ol class="results"></ol>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lunr.js/2.0.1/lunr.min.js"></script>
    <script>
      var MVW;
      (function (MVW) {
          var Search;
          (function (Search) {
              var index;
              var store;
              function handleSearch(e) {
                  var query = $("input.mvw-search-field").val();
                  var result = index.search(query);
                  var resultContainer = $(".results");
                  if (result.length === 0) {
                      resultContainer.hide();
                  }
                  else {
                      resultContainer.empty();
                      for (var item in result) {
                          if (result.hasOwnProperty(item)) {
                              var ref = result[item].ref;
                              var i = "<li><a href=\"" + ref + ".html\">" + store[ref].title + "</a><span>" + store[ref].description + "</span></li>";
                              resultContainer.append(i);
                          }
                      }
                      resultContainer.show();
                  }
              }
              function getParameterByName(name) {
                  var url = window.location.href;
                  name = name.replace(/[\[\]]/g, "\\$&");
                  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
                  var results = regex.exec(url);
                  if (!results) {
                      return null;
                  }
                  if (!results[2]) {
                      return "";
                  }
                  return decodeURIComponent(results[2].replace(/\+/g, " "));
              }
              function initialize() {
                  $.getJSON("/index.json", function (data) {
                      index = lunr.Index.load(data.index);
                      store = data.store;
                      var query = getParameterByName("query") || getParameterByName("q");
                      var inputField = $("input.mvw-search-field");
                      if (query) {
                          inputField.val(query);
                      }
                      inputField.on("keyup", handleSearch);
                      handleSearch(null);
                  });
              }
              Search.initialize = initialize;
          })(Search = MVW.Search || (MVW.Search = {}));
      })(MVW || (MVW = {}));
      $(function () { return MVW.Search.initialize(); });
    </script>
  </body>
</html>
```

## Releases
- 2.1.4 - 2.1.12: dependency update
- 2.1.3: added support of glob on API
- 2.1.1: added CLI
- 2.1.0: renamed `referencedFile` to `href`; allowing to parse HTML files directly
- 2.0: Reason for major release: API break due to update to lunr 2.0.
