// Run: node --test .github/factory/contract.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkChanges, contractHash, globToRegExp, parseIssueForm } from "./contract.mjs";

const SCRIPT = fileURLToPath(new URL("./contract.mjs", import.meta.url));

const ISSUE_BODY = `### Goal

Add a marketing FAQ section.

### Success conditions

- FAQ renders on /
- npm run verify passes

### Non-goals

_No response_

### Stop conditions

- Any change outside allowed paths is needed

### Allowed paths

apps/marketing/src/**
tests/marketing-*.test.mjs

### Required evidence

- npm run verify

### Risk class

low
`;

const contract = parseIssueForm(ISSUE_BODY, 42);
const hash = contractHash(contract);
const body = (h = hash) => `Implements #42\n\nFactory-Contract-Hash: ${h}\nFactory-Attempt: a1\n`;

test("parses the issue form into a contract with mandatory forbidden paths", () => {
  assert.equal(contract.issue, 42);
  assert.equal(contract.goal, "Add a marketing FAQ section.");
  assert.deepEqual(contract.nonGoals, []);
  assert.deepEqual(contract.allowedPaths, ["apps/marketing/src/**", "tests/marketing-*.test.mjs"]);
  assert.deepEqual(contract.forbiddenPaths, [".github/**", "scripts/**", "docs/contracts/**"]);
  assert.equal(contract.riskClass, "low");
});

test("hash is stable across whitespace edits and changes with content", () => {
  assert.equal(contractHash(parseIssueForm(ISSUE_BODY.replace(/\n\n/g, "\n\n\n"), 42)), hash);
  assert.notEqual(contractHash(parseIssueForm(ISSUE_BODY.replace("low", "high"), 42)), hash);
});

test("rejects a contract missing required fields or with an escaping glob", () => {
  assert.throws(() => parseIssueForm(ISSUE_BODY.replace("apps/marketing/src/**\n", "").replace("tests/marketing-*.test.mjs", ""), 42), /allowedPaths is required/);
  assert.throws(() => parseIssueForm(ISSUE_BODY.replace("apps/marketing/src/**", "../secrets/**"), 42), /repo-relative/);
  assert.throws(() => parseIssueForm(ISSUE_BODY.replace("\nlow\n", "\nmedium\n"), 42), /riskClass/);
});

test("glob semantics", () => {
  assert.ok(globToRegExp("apps/marketing/src/**").test("apps/marketing/src/a/b.tsx"));
  assert.ok(!globToRegExp("apps/marketing/src/*").test("apps/marketing/src/a/b.tsx"));
  assert.ok(globToRegExp("**/README.md").test("README.md"));
  assert.ok(globToRegExp("**/README.md").test("docs/x/README.md"));
  assert.ok(!globToRegExp("tests/*.ts").test("tests.ts"));
});

test("passing change list", () => {
  const changed = [".factory/contract.json", "apps/marketing/src/faq.tsx", "tests/marketing-faq.test.mjs"];
  assert.deepEqual(checkChanges(contract, changed, body()), []);
});

test("failing change list names every violation", () => {
  const changed = [
    ".factory/contract.json",
    "apps/marketing/src/faq.tsx",
    "apps/web/src/app/page.tsx",
    ".github/workflows/ci.yml",
    "scripts/vercel-build.mjs",
    "docs/contracts/issue-2-freeze.md",
  ];
  const violations = checkChanges(contract, changed, body());
  assert.equal(violations.length, 4);
  assert.match(violations.join("\n"), /apps\/web\/src\/app\/page.tsx: outside allowedPaths/);
  assert.match(violations.join("\n"), /\.github\/workflows\/ci\.yml: touches a protected path/);
});

test("contract-specific forbiddenPaths win over allowedPaths", () => {
  const narrowed = { ...contract, forbiddenPaths: [...contract.forbiddenPaths, "apps/marketing/src/secret/**"] };
  const violations = checkChanges(narrowed, [".factory/contract.json", "apps/marketing/src/secret/x.ts"], body(contractHash(narrowed)));
  assert.deepEqual(violations, ["apps/marketing/src/secret/x.ts: matches forbiddenPaths"]);
});

test("hash trailer must match the committed contract and contract must be committed", () => {
  const violations = checkChanges(contract, ["apps/marketing/src/faq.tsx"], body("0".repeat(64)));
  assert.match(violations.join("\n"), /must be committed/);
  assert.match(violations.join("\n"), /does not match/);
  assert.match(checkChanges(contract, [".factory/contract.json"], "no trailers").join("\n"), /Factory-Attempt/);
});

test("CLI guard exits 0 on pass and 1 on fail", () => {
  const dir = mkdtempSync(join(tmpdir(), "factory-guard-"));
  const contractFile = join(dir, "contract.json");
  const bodyFile = join(dir, "body.md");
  writeFileSync(contractFile, JSON.stringify(contract));
  writeFileSync(bodyFile, body());
  writeFileSync(join(dir, "ok.txt"), ".factory/contract.json\napps/marketing/src/faq.tsx\n");
  writeFileSync(join(dir, "bad.txt"), ".factory/contract.json\nscripts/vercel-build.mjs\n");
  assert.match(execFileSync(process.execPath, [SCRIPT, "guard", contractFile, join(dir, "ok.txt"), bodyFile], { encoding: "utf8" }), /PASS/);
  assert.throws(() => execFileSync(process.execPath, [SCRIPT, "guard", contractFile, join(dir, "bad.txt"), bodyFile], { stdio: "pipe" }), (error) => error.status === 1);
  assert.equal(execFileSync(process.execPath, [SCRIPT, "hash", contractFile], { encoding: "utf8" }).trim(), hash);
});
