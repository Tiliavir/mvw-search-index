import {describe, it, expect} from "vitest";
import {spawnSync} from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Runs the compiled CLI - `npm test` builds before running the specs.
const cli = path.join(__dirname, "..", "js", "cli.js");

function tempFile(name: string): string {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "mvw-search-index-")), name);
}

function run(...args: string[]) {
  const result = spawnSync(process.execPath, [cli, ...args], {encoding: "utf8"});
  return {code: result.status, stdout: result.stdout, stderr: result.stderr};
}

describe("CLI", () => {
  it("reports the package version", () => {
    const {version} = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
    expect(run("--version").stdout.trim()).toBe(version);
  });

  it("writes the index, creating missing directories, and prints a summary", () => {
    const dest = tempFile("nested/dir/index.json");
    const {code, stdout} = run("**/*.html", dest, "body.to-be-indexed", "--cwd", "docs", "--base-url", "/");
    expect(code).toBe(0);
    expect(stdout.trim()).toBe(`Indexed 3 page(s) into ${dest}`);

    const written = JSON.parse(fs.readFileSync(dest, "utf8"));
    expect(Object.keys(written.store)).toEqual(["/foo.html", "/index.html", "/sub/index.html"]);
    expect(written.index.version).toBeDefined();
  });

  it("lists every file with --verbose", () => {
    const {code, stdout} = run("docs/foo.html", tempFile("index.json"), "--verbose");
    expect(code).toBe(0);
    expect(stdout).toContain("Indexing docs/foo.html");
  });

  it("passes the language option through", () => {
    const dest = tempFile("index.json");
    expect(run("docs/foo.html", dest, "--language", "de").code).toBe(0);
    expect(JSON.parse(fs.readFileSync(dest, "utf8")).index.pipeline).toContain("stemmer-de");
  });

  it("fails with exit code 1 and a message if nothing matches", () => {
    const dest = tempFile("index.json");
    const {code, stderr} = run("does-not-exist/*.html", dest);
    expect(code).toBe(1);
    expect(stderr).toMatch(/^Error: No files match/);
    expect(fs.existsSync(dest)).toBe(false);
  });

  it("rejects invalid boosts", () => {
    const {code, stderr} = run("docs/foo.html", tempFile("index.json"), "--boost", "titel=3");
    expect(code).not.toBe(0);
    expect(stderr).toContain("Expected <field>=<number>");
  });
});
