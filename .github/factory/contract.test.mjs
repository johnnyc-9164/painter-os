// Run: node --test .github/factory/contract.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { checkChanges as checkApprovedChanges, decodeChangedPaths, contractHash, globToRegExp, matchesAny, parseIssueForm, validateContract, validatePexProposalSet } from "./contract.mjs";

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


const PEX_EXPANSION_REPO = fileURLToPath(new URL("../../", import.meta.url));
const pexContract = (stl) => JSON.parse(readFileSync(join(PEX_EXPANSION_REPO, `.factory/contracts/STL-${stl}.json`), "utf8"));
const readRepo = (path) => readFileSync(join(PEX_EXPANSION_REPO, path), "utf8");
const roleWorker = { "agent-design": "painter-os-design", "agent-features": "painter-os-features", "agent-lead": "painter-os-dev" };

test("PEX expansion contracts require separate, internally consistent agent and worker scopes", () => {
  const contract = pexContract(248);
  assert.equal(contract.agentScope.role, contract.ownerType);
  assert.ok(contract.agentScope.responsibilities.length > 0);
  assert.ok(contract.agentScope.authority.length > 0);
  assert.ok(contract.agentScope.prohibitedActions.some((item) => /self-approv/i.test(item)));
  assert.equal(contract.workerScope.worker, "painter-os-design");
  assert.equal(contract.workerScope.repository, "johnnyc-9164/painter-os");
  assert.equal(contract.workerScope.sprite, contract.workerScope.worker);
  assert.equal(contract.workerScope.worktree, "isolated-per-issue");
  assert.equal(contract.workerScope.branch, contract.branch);
  assert.deepEqual(contract.workerScope.ownedPaths, contract.allowedPaths);
  assert.equal(contract.workerScope.buildSlot.maxConcurrentHeavyCommands, 1);
  assert.equal(contract.workerScope.buildSlot.helper, "/home/sprite/workspace/painter-thread-tools/with-build-slot.sh");
  assert.equal(validateContract(contract), contract);
});

test("all 48 PEX proposals preserve unapproved status and map role to the Linear worker", () => {
  const contracts = [];
  for (let stl = 248; stl <= 295; stl += 1) {
    const contract = pexContract(stl);
    contracts.push(contract);
    assert.equal(contract.issue, stl + 59, `STL-${stl} GitHub issue mapping`);
    assert.equal(contract.linearIssue, `STL-${stl}`, `STL-${stl} Linear mapping`);
    assert.equal(contract.proposalId, `PEX-${String(stl - 247).padStart(3, "0")}`);
    assert.equal(contract.factoryEligible, false, `STL-${stl} must remain ineligible`);
    assert.equal(contract.approvalStatus, "proposed_unapproved", `STL-${stl} must remain unapproved`);
    assert.equal(contract.agentScope.role, contract.ownerType, `STL-${stl} role mapping`);
    assert.equal(contract.workerScope.worker, roleWorker[contract.ownerType], `STL-${stl} worker mapping`);
    assert.equal(contract.workerScope.sprite, roleWorker[contract.ownerType], `STL-${stl} Sprite mapping`);
    assert.equal(contract.workerScope.repository, "johnnyc-9164/painter-os", `STL-${stl} repository boundary`);
    assert.equal(contract.workerScope.branch, contract.branch, `STL-${stl} branch binding`);
    assert.deepEqual(contract.workerScope.ownedPaths, contract.allowedPaths, `STL-${stl} path binding`);
    assert.equal(validateContract(contract), contract);
  }
  assert.equal(validatePexProposalSet(contracts).length, 48);
});

test("PEX-006 uses literal paths supported by the actual minimal matcher", () => {
  const contract = pexContract(253);
  assert.deepEqual(contract.allowedPaths, [
    "packages/ui/src/components/status-badge.tsx",
    "packages/ui/src/components/summary-metric.tsx",
    "tests/ui-status-metric.test.tsx",
  ]);
  assert.ok(matchesAny("packages/ui/src/components/status-badge.tsx", contract.allowedPaths));
  assert.ok(matchesAny("packages/ui/src/components/summary-metric.tsx", contract.allowedPaths));
  assert.ok(!matchesAny("packages/ui/src/components/other.tsx", contract.allowedPaths));
});

test("consumer contracts include the real mount points and serialize shared app-shell ownership", () => {
  const shell = pexContract(256);
  const timeline = pexContract(260);
  const company = pexContract(284);
  const releases = pexContract(288);
  assert.ok(shell.allowedPaths.includes("apps/web/src/components/painter-app.tsx"));
  assert.ok(timeline.allowedPaths.includes("apps/web/src/components/painter-app.tsx"));
  assert.ok(timeline.dependsOn.includes("STL-256"));
  assert.ok(timeline.phase >= shell.phase);
  assert.ok(company.allowedPaths.includes("packages/ui/src/components/company-website.tsx"));
  assert.ok(company.allowedPaths.includes("tests/company-website-renderer.test.tsx"));
  assert.ok(releases.allowedPaths.includes("packages/platform-admin-ui/src/components/platform-app.tsx"));
  assert.ok(releases.allowedPaths.includes("packages/platform-admin-ui/src/components/platform-view.tsx"));
  assert.ok(releases.allowedPaths.includes("apps/platform-admin/src/app/platform/[[...section]]/page.tsx"));
});

test("CI explicitly discovers every proposed test family, including nested visual and MJS tests", () => {
  const pkg = JSON.parse(readRepo("package.json"));
  const forms = readRepo("vitest.forms.config.ts");
  const workflow = readRepo(".github/workflows/ci.yml");
  const visualConfig = readRepo("playwright.visual.config.ts");
  assert.match(forms, /tests\/\*\*\/\*\.test\.tsx/);
  assert.match(pkg.scripts["test:node-mjs"], /node --test tests\/\*\.test\.mjs/);
  assert.match(pkg.scripts.test, /test:node-mjs/);
  assert.match(pkg.scripts.test, /test:factory-contracts/);
  assert.match(pkg.scripts["test:factory-contracts"], /\.github\/factory\/contract\.test\.mjs/);
  assert.match(pkg.scripts["test:visual-regression"], /playwright test --config=playwright\.visual\.config\.ts/);
  assert.match(visualConfig, /tests\/visual-regression/);
  assert.match(visualConfig, /\.spec\.ts/);
  assert.match(workflow, /npm run test:visual-regression/);
  assert.match(workflow, /playwright install --with-deps chromium/);
  assert.ok(pexContract(294).requiredChecks.includes("build"));
  assert.match(visualConfig, /server\('web', 3001\)/);
  assert.match(visualConfig, /server\('marketing', 3002\)/);
  assert.match(visualConfig, /server\('company-site', 3003\)/);
  assert.match(visualConfig, /server\('platform-admin', 3004\)/);
  const tsxPaths = [];
  for (let stl = 248; stl <= 295; stl += 1) tsxPaths.push(...pexContract(stl).allowedPaths.filter((path) => path.endsWith(".test.tsx")));
  assert.equal(tsxPaths.length, 27, "all 27 proposed TSX tests must be registered");
});


test("validator rejects role/worker drift and reactivation of a proposal", () => {
  const contract = pexContract(248);
  assert.throws(() => validateContract({ ...contract, workerScope: { ...contract.workerScope, worker: "painter-os-features" } }), /workerScope.worker/);
  assert.throws(() => validateContract({ ...contract, factoryEligible: true }), /must remain factoryEligible:false/);
  assert.throws(() => validateContract({ ...contract, allowedPaths: ["packages/ui/src/components/{one,two}.tsx"] }), /brace expansion is unsupported/);
});

test("PEX dependency validator rejects phase inversion and cycles", () => {
  const contracts = Array.from({ length: 48 }, (_, index) => pexContract(index + 248));
  const inverted = contracts.map((item) => structuredClone(item));
  inverted.find((item) => item.linearIssue === "STL-260").phase = 0;
  assert.throws(() => validatePexProposalSet(inverted), /depends on later phase/);

  const cyclic = contracts.map((item) => structuredClone(item));
  const shell = cyclic.find((item) => item.linearIssue === "STL-256");
  const timeline = cyclic.find((item) => item.linearIssue === "STL-260");
  shell.dependsOn.push("STL-260");
  timeline.blocks.push("STL-256");
  assert.throws(() => validatePexProposalSet(cyclic), /dependency cycle/);
});
