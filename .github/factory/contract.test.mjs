// Run: node --test .github/factory/contract.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkChanges as checkApprovedChanges, decodeChangedPaths, contractHash, globToRegExp, parseIssueForm } from "./contract.mjs";

const checkChanges = (contract, files, body) => checkApprovedChanges(contract, files, body, { contract, attempt: "a1" });

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
  mkdirSync(join(dir, "approvals"));
  writeFileSync(join(dir, "approvals", "42.json"), JSON.stringify({contract, attempt: "a1"}));
  writeFileSync(contractFile, JSON.stringify(contract));
  writeFileSync(bodyFile, body());
  writeFileSync(join(dir, "ok.txt"), ".factory/contract.json\0apps/marketing/src/faq.tsx\0");
  writeFileSync(join(dir, "bad.txt"), ".factory/contract.json\0scripts/vercel-build.mjs\0");
  assert.match(execFileSync(process.execPath, [SCRIPT, "guard", contractFile, join(dir, "ok.txt"), bodyFile, join(dir, "approvals")], { encoding: "utf8" }), /PASS/);
  assert.throws(() => execFileSync(process.execPath, [SCRIPT, "guard", contractFile, join(dir, "bad.txt"), bodyFile, join(dir, "approvals")], { stdio: "pipe" }), (error) => error.status === 1);
  assert.equal(execFileSync(process.execPath, [SCRIPT, "hash", contractFile], { encoding: "utf8" }).trim(), hash);
});


test("PR widening and rehashing cannot replace base authority", () => {
  const widened = { ...contract, allowedPaths: ["**"] };
  assert.match(checkApprovedChanges(widened, [".factory/contract.json", "apps/web/x.ts"], body(contractHash(widened)), {contract, attempt: "a1"}).join("\n"), /differs from base-owned/);
  assert.match(checkApprovedChanges(contract, [".factory/contract.json"], body().replace("a1", "a2"), {contract, attempt: "a1"}).join("\n"), /Attempt does not match/);
  assert.match(checkApprovedChanges(contract, [".factory/contract.json"], body()).join("\n"), /missing base-owned/);
});

test("NUL paths preserve whitespace and protect odd names under broad scope", () => {
  const broad = { ...contract, allowedPaths: ["**"] };
  const paths = [".factory/contract.json", "scripts/ odd\nname\t.mjs", " leading ", "apps/marketing/src/line\nbreak.ts"];
  assert.deepEqual(decodeChangedPaths(Buffer.from(paths.join("\0") + "\0")), paths);
  assert.match(checkChanges(broad, paths, body(contractHash(broad))).join("\n"), /touches a protected path/);
  assert.ok(globToRegExp("**").test(paths[3]));
  assert.throws(() => decodeChangedPaths(Buffer.from("quoted\n")), /NUL/);
  assert.throws(() => decodeChangedPaths(Buffer.from([255, 0])), /encoded data/);
});

test("rejects malformed typed evidence fields", () => {
  assert.throws(() => checkChanges({...contract, successConditions: "yes"}, [], body()), /array of nonempty strings/);
});


test("real Git NUL output cannot C-quote a protected filename into broad allowance", () => {
  const dir = mkdtempSync(join(tmpdir(), "factory-git-"));
  const git = (...args) => execFileSync("git", args, {cwd: dir});
  git("init", "--quiet");
  git("-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "--allow-empty", "--quiet", "-m", "base");
  mkdirSync(join(dir, "scripts"));
  writeFileSync(join(dir, "scripts", 'odd \"name\n.mjs'), "data");
  writeFileSync(join(dir, "contract.json"), "data");
  git("add", ".");
  const changed = decodeChangedPaths(git("diff", "--cached", "--no-renames", "--name-only", "-z"));
  assert.ok(changed.includes('scripts/odd \"name\n.mjs'));
  const broad = {...contract, allowedPaths: ["**"]};
  assert.match(checkChanges(broad, [".factory/contract.json", ...changed], body(contractHash(broad))).join("\n"), /touches a protected path/);
});

test("backend/auth paths require explicit high risk approval", () => {
  const broad = {...contract, allowedPaths: ["**"]};
  assert.match(checkChanges(broad, [".factory/contract.json", "apps/web/src/app/api/auth/route.ts"], body(contractHash(broad))).join("\n"), /require riskClass high/);
});


test("workflow keeps trusted execution and ephemeral read-only fetch authentication", () => {
  const workflow = readFileSync(new URL("../workflows/factory-path-guard.yml", import.meta.url), "utf8");
  assert.match(workflow, /pull_request_target:/);
  assert.doesNotMatch(workflow, /\n  pull_request:/);
  assert.match(workflow, /permissions:\n  contents: read/);
  assert.match(workflow, /ref: \$\{\{ github.event.pull_request.base.sha \}\}/);
  assert.match(workflow, /persist-credentials: false/);
  assert.equal((workflow.match(/uses: actions\/checkout@/g) ?? []).length, 1);
  assert.match(workflow, /FETCH_TOKEN: \$\{\{ github.token \}\}/);
  assert.match(workflow, /GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=http\.https:\/\/github\.com\/\.extraheader GIT_CONFIG_VALUE_0=/);
  assert.match(workflow, /unset auth_header FETCH_TOKEN/);
  assert.match(workflow, /git show "\$HEAD_SHA:\.factory\/contract.json"/);
  assert.match(workflow, /--name-only -z/);
  assert.doesNotMatch(workflow, /secrets\.|set -x|git config|actions\/cache|download-artifact|npm install|npm ci/);
  const enforce = workflow.split("- name: Enforce base-owned approval")[1];
  assert.doesNotMatch(enforce, /FETCH_TOKEN|github.token/);
});
