# Upgrading from 2.x to 3.0

Version 3 fixes how pages are turned into an index. Search results get much better, but the generated
`index.json` is different, and the API, the CLI and the client-side code need small changes. Most sites need
about 15 minutes to upgrade.

## Checklist

1. [Use Node.js 22.12 or newer](#1-nodejs-2212-or-newer).
2. If you call the API: [`await` `createFromGlob()`](#2-createfromglob-returns-a-promise) instead of passing a callback.
3. [Update the search code in your pages](#3-update-the-client-side-search-code). Queries like `"*" + input + "*"`
   now miss stemmed words and can crash on some inputs.
4. If your content is not English, [set `language` and load the language scripts](#4-content-in-other-languages).
5. [Review the new indexing defaults](#5-what-is-indexed-changed): `nav`/`footer` excluded, `noindex` pages skipped.
6. If you rely on CLI output or exit codes, [check the CLI changes](#6-cli-changes).
7. Rebuild the index and test a few searches.

If you need to stay as close to 2.x as possible while you migrate, see
[Restoring 2.x behaviour](#restoring-2x-behaviour).

---

## 1. Node.js 22.12 or newer

`package.json` now declares `"engines": {"node": ">=22.12.0"}`. This is not a new requirement: the CLI's
dependency `commander` 15, used since 2.3.x, already needed it.

## 2. `createFromGlob()` returns a Promise

The callback is gone. Errors (an unreadable file, an exception in your own code) used to become an uncaught
exception that crashed the process. Now they reject the promise, so you can handle them.

```js
// 2.x
SearchIndex.createFromGlob("./build/**/*.html", "main", (index) => {
  fs.writeFileSync("./build/index.json", JSON.stringify(index));
});

// 3.0
const index = await SearchIndex.createFromGlob("**/*.html", {cwd: "build", bodySelector: "main"});
await fs.promises.writeFile("./build/index.json", JSON.stringify(index));
```

If you pass a callback anyway, `createFromGlob()` throws a `TypeError` that points to this guide. Without that
check, the callback would silently never be called and your index never written.

Also:

- **Options object.** The second argument of `createFromGlob()` and `createFromHtml()` is now an options object
  (see the [README](README.md#options)). A plain string still works and means `bodySelector`.
- **No matches is an error.** `createFromGlob()` rejects if the pattern matches no files, so a typo in a path
  fails the build instead of shipping an empty index. Set `allowEmpty: true` if an empty result is legitimate.
- **No logging by default.** The library no longer prints every file name with `console.info`. To get progress
  messages, pass `logger: console`, or any object with `info(message)` and `warn(message)`.
- **Duplicate hrefs throw.** Two documents with the same `href` used to overwrite each other in the result store,
  which showed one page's title for another page's match. `createFromInfo()` and `createFromHtml()` now throw.
- **Types.**
  - `HtmlFile` (the file type of `createFromHtml()`) is now exported. `ReadFileWithContents` stays as a
    deprecated alias.
  - `contents` may be a `string` as well as a `Buffer`.
  - `IFileInformation.description` and `.keywords` are now optional (`?:`) instead of `string | undefined`.
  - In `IResultStore`, `description` is optional.
- **Files are sorted.** Files are indexed in sorted order, so the same site always produces the same
  `index.json`.

### Hrefs relative to your site root: the `cwd` option

Hrefs are the matched paths relative to the working directory, which hasn't changed. But
`createFromGlob("./build/**/*.html")` produced hrefs like `build/foo.html`, which is wrong on the deployed site.
Use the new `cwd` option instead of `cd`-ing into the build directory:

```js
await SearchIndex.createFromGlob("**/*.html", {cwd: "build"}); // hrefs: "foo.html", "sub/index.html"
```

Two more options help when the search page is not at the site root:

- `baseUrl: "/"` gives root-relative links (`/foo.html`).
- `stripIndexHtml: true` links to `sub/` instead of `sub/index.html`.

On Windows, hrefs now always use `/`. Before, they contained backslashes.

## 3. Update the client-side search code

**The index is now stemmed**, as lunr intends: `concerts` and `concert` are both indexed as `concert`.
`lunr.Index.load()` applies the same stemmer to normal queries automatically. **Wildcard queries skip the
stemmer**, though. The common 2.x pattern of wrapping the input in wildcards therefore stops matching:

```js
index.search("*" + query + "*"); // 2.x demo - don't do this any more
```

It also crashed on inputs that are lunr query syntax, such as `title:`, `foo~` or `Konzert:`
(`QueryParseError`).

Build the query with lunr's query API instead. Each word is matched as a whole (stemmed) and as a prefix, so
results still show up while typing:

```js
function search(input) {
  const terms = lunr.tokenizer(input)
    .map((token) => lunr.trimmer(token).toString())
    .filter((term) => term.length > 0);
  if (terms.length === 0) {
    return [];
  }
  return index.query((query) => {
    for (const term of terms) {
      query.term(term, {boost: 10});
      query.term(term, {usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING});
    }
  });
}
```

While you're in that code, render the result `title` and `description` with `textContent` rather than
concatenating them into `innerHTML`. [docs/index.html](docs/index.html) shows the complete code.

If you keep using `index.search(input)` with user input, that works with the stemmed index. Wrap it in
`try`/`catch` for `lunr.QueryParseError`.

## 4. Content in other languages

lunr's built-in processing is English only. For German content, for example, 2.x removed English stop words,
applied the English stemmer and cut umlauts off word ends (`Menü` → `men`). Set the language:

```js
await SearchIndex.createFromGlob("**/*.html", {cwd: "public", language: "de"});
```

```bash
mvw-search-index '**/*.html' public/suche/index.json --cwd public --language de
```

The index then references the language's pipeline functions. **The page must load the matching
[lunr-languages](https://github.com/MihaiValentin/lunr-languages) scripts before `lunr.Index.load()`.** Otherwise
loading fails with `Cannot load unregistered function: trimmer-de`.

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/lunr.js/2.3.9/lunr.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lunr-languages@1.22.0/lunr.stemmer.support.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lunr-languages@1.22.0/lunr.de.js"></script>
```

In the `search()` function above, use `lunr.de.trimmer` instead of `lunr.trimmer`.

English content needs neither the option nor extra scripts.

## 5. What is indexed changed

All of these change the contents of `index.json`. Rebuild it after upgrading.

| Change | Effect | Opt out |
|---|---|---|
| lunr's default pipeline is applied: trimmer, stop words, stemmer | `concert` finds `concerts`; `Blasmusik` finds the keyword `Blasmusik,`; the index gets smaller | - |
| Text in separate block elements stays separate (`<li>a</li><li>b</li>` is `a b`, not `ab`) | Words in lists, headings, tables and minified HTML are findable | - |
| Multiple elements matching `bodySelector` are joined with spaces | Same as above | - |
| `<script>`, `<style>`, `<noscript>` and `<template>` are never indexed | JS identifiers and CSS no longer match | - |
| `nav` and `footer` inside the body are excluded | Menu and footer words (`Impressum`, `Kontakt`) no longer match every page | `excludeSelector: ""` / `--exclude ""` |
| Pages with `<meta name="robots" content="noindex">` (or `none`) are skipped | Drafts and thank-you pages disappear from results | `respectNoindex: false` / `--no-noindex` |
| Keywords are split on `,` and `;`, also without spaces | `Blasmusik,Konzert` gives two keywords | - |
| Title falls back to `og:title`, then the first `<h1>`; description to `og:description`; all are whitespace-trimmed | Fewer empty titles; no line breaks in titles | - |
| Field boosts: title 5, keywords 3, description 2, body 1 | Title matches rank above body matches. Which pages match is unchanged, only their order | `boosts: {title: 1, keywords: 1, description: 1, body: 1}` |

Note that `excludeSelector` only removes elements **inside** the body selector. With `bodySelector: "main"`
and navigation outside `<main>`, the default makes no difference.

## 6. CLI changes

- **Quiet by default.** Instead of one line per file, the CLI prints one summary line,
  `Indexed 12 page(s) into public/index.json`. Use `--verbose` for the per-file list. Warnings, such as a page
  without any title, go to stderr.
- **Real exit codes.**
  - Any error exits with code `1` and prints `Error: <message>`. This includes a glob that matches nothing; use
    `--allow-empty` if that is expected.
  - Before, read errors crashed the process with a stack trace, and a glob without matches exited with `0`.
- **`--version`** prints the actual package version, not the hardcoded `2.2.8`.
- **The destination directory is created** if it doesn't exist.
- **New flags** for all options: `--cwd`, `--exclude`, `--language`, `--base-url`, `--strip-index-html`,
  `--no-noindex`, `--allow-empty`, `--boost` and `--verbose`. See `mvw-search-index --help` or the
  [README](README.md#cli).

The positional arguments are unchanged: `<glob> <dest> [bodySelector]`.

A typical 2.x script and its 3.0 equivalent:

```json
"index": "cd public && mvw-search-index './**/*.html' suche/index.json 'main'"
```

```json
"index": "mvw-search-index '**/*.html' public/suche/index.json main --cwd public"
```

## 7. Packaging

- The npm package now contains only the compiled JavaScript and type declarations. It no longer includes
  source maps or config files.
- `js/` is no longer committed to the repository. If you install the package straight from GitHub
  (`npm install github:Tiliavir/mvw-search-index`), npm builds it through the `prepare` script.

---

## Restoring 2.x behaviour

Some defaults can be switched back while you migrate:

```js
await SearchIndex.createFromGlob(pattern, {
  bodySelector,
  excludeSelector: "",                                     // index nav/footer again
  respectNoindex: false,                                   // index noindex pages again
  boosts: {title: 1, keywords: 1, description: 1, body: 1}, // equal field weights
  allowEmpty: true,                                        // don't fail on no matches
  logger: console,                                         // print every file
});
```

The text extraction and pipeline fixes (separated words, no scripts and styles, stemming and stop words) can't be
switched off. They fix incorrect indexing rather than change a preference.
