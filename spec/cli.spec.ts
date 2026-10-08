import {describe, it, expect} from "vitest";
import {spawnSync} from "child_process";
import * as fs from "fs";
import * as path from "path";

// Runs the compiled CLI - `npm test` builds before running the specs.
const cli = path.join(__dirname, "..", "js", "cli.js");

function run(...args: string[]) {
  const result = spawnSync(process.execPath, [cli, ...args], {encoding: "utf8"});
  return {code: result.status, stdout: result.stdout, stderr: result.stderr};
}

describe("CLI", () => {
  it("reports the package version", () => {
    const {version} = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
    expect(run("--version").stdout.trim()).toBe(version);
  });
});
