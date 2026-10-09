import {describe, it, expect} from "vitest";
import {spawnSync} from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// Runs the compiled CLI - `npm test` builds before running the specs.
const repo = path.join(__dirname, "..");
const cli = path.join(repo, "js", "cli.js");
const docs = path.join(repo, "docs");

/** A fresh, empty directory to run the CLI in - <dest> has to be inside it. */
function workDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "mvw-search-index-"));
}

function run(cwd: string, ...args: string[]) {
  const result = spawnSync(process.execPath, [cli, ...args], {cwd, encoding: "utf8"});
  return {code: result.status, stdout: result.stdout, stderr: result.stderr};
}

describe("CLI", () => {
  it("reports the package version", () => {
    const {version} = JSON.parse(fs.readFileSync(path.join(repo, "package.json"), "utf8"));
    expect(run(repo, "--version").stdout.trim()).toBe(version);
  });

  it("writes the index, creating missing directories, and prints a summary", () => {
    const work = workDir();
    const {code, stdout} = run(work, "**/*.html", "nested/dir/index.json", "body.to-be-indexed",
      "--cwd", docs, "--base-url", "/");
    expect(code).toBe(0);
    expect(stdout.trim()).toBe("Indexed 3 page(s) into nested/dir/index.json");

    const written = JSON.parse(fs.readFileSync(path.join(work, "nested/dir/index.json"), "utf8"));
    expect(Object.keys(written.store)).toEqual(["/foo.html", "/index.html", "/sub/index.html"]);
    expect(written.index.version).toBeDefined();
  });

  it("accepts an absolute destination inside the current directory", () => {
    const work = workDir();
    const dest = path.join(work, "index.json");
    expect(run(work, "foo.html", dest, "--cwd", docs).code).toBe(0);
    expect(fs.existsSync(dest)).toBe(true);
  });

  it("refuses to write outside the current directory", () => {
    const work = workDir();
    for (const dest of ["../outside.json", path.join(os.tmpdir(), "outside.json"), "."]) {
      const {code, stderr} = run(work, "foo.html", dest, "--cwd", docs);
      expect(code, dest).toBe(1);
      expect(stderr, dest).toMatch(/^Error: <dest> must be a file inside the current directory/);
    }
    expect(fs.existsSync(path.join(work, "..", "outside.json"))).toBe(false);
  });

  it("lists every file with --verbose", () => {
    const {code, stdout} = run(workDir(), "docs/foo.html", "index.json", "--cwd", repo, "--verbose");
    expect(code).toBe(0);
    expect(stdout).toContain("Indexing docs/foo.html");
  });

  it("passes the language option through", () => {
    const work = workDir();
    expect(run(work, "foo.html", "index.json", "--cwd", docs, "--language", "de").code).toBe(0);
    expect(JSON.parse(fs.readFileSync(path.join(work, "index.json"), "utf8")).index.pipeline).toContain("stemmer-de");
  });

  it("fails with exit code 1 and a message if nothing matches", () => {
    const work = workDir();
    const {code, stderr} = run(work, "does-not-exist/*.html", "index.json");
    expect(code).toBe(1);
    expect(stderr).toMatch(/^Error: No files match/);
    expect(fs.existsSync(path.join(work, "index.json"))).toBe(false);
  });

  it("rejects invalid boosts", () => {
    const {code, stderr} = run(workDir(), "foo.html", "index.json", "--cwd", docs, "--boost", "titel=3");
    expect(code).not.toBe(0);
    expect(stderr).toContain("Expected <field>=<number>");
  });
});
