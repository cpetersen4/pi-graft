import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

// Each test file runs in its own process. A fresh host must work without
// inheriting GRAFT_BIN or finding a similarly named executable on PATH.
delete process.env.GRAFT_BIN;
const { default: extension } = await import("../extensions/graft.ts");
const entry = join(dirname(createRequire(import.meta.url).resolve("@nanonets/graft/package.json")), "dist", "bin", "graft.js");

test("default CLI returns real signatures and caller edges without GRAFT_BIN", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "graft default with spaces "));
  try {
    writeFileSync(join(cwd, "math.ts"), "export function double(n: number): number { return n * 2; }\nexport function quadruple(n: number): number { return double(double(n)); }\n");
    execFileSync(process.execPath, [entry, "build", "--no-gitignore", "--no-ignore"], { cwd, timeout: 30000, stdio: "pipe" });
    const tools = new Map();
    extension({ on() {}, registerCommand() {}, registerTool(tool) { tools.set(tool.name, tool); } });
    const api = await tools.get("graft_file_api").execute("api", { file: "math.ts" }, undefined, undefined, { cwd });
    assert.notEqual(api.isError, true);
    assert.match(api.content[0].text, /function double\(n: number\): number/);
    assert.match(api.content[0].text, /function quadruple\(n: number\): number/);
    const callers = await tools.get("graft_trace_calls").execute("callers", { symbol: "double" }, undefined, undefined, { cwd });
    assert.notEqual(callers.isError, true);
    assert.match(callers.content[0].text, /quadruple/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
