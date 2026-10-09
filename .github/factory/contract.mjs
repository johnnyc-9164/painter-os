#!/usr/bin/env node
// Factory execution-contract helper. No dependencies; Node >= 22.
//
// One module owns three related jobs so the build workflow, the path guard
// and the review workflow all agree on the same parsing and hash:
//   from-issue <issue-body-file> <issue-number>  -> contract JSON on stdout
//   hash <contract.json>                          -> canonical sha256 hex on stdout
//   guard <contract.json> <changed-files-file> <pr-body-file> <base-approval-directory>
//                                                 -> exit 1 on any violation
//
// The contract hash is sha256 over the canonical JSON (sorted keys) of the
// parsed contract, not over the raw issue text, so whitespace edits to the
// issue do not change it but any edit to a field does.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const CONTRACT_VERSION = 1;
export const HIGH_RISK_PATHS = ["packages/backend/**", "packages/domain/**", "**/convex/**", "packages/contractor-os-core/**", "apps/web/src/app/api/**", "apps/web/src/lib/**"];
export const CONTRACT_PATH = ".factory/contract.json";

// Paths a factory PR may never touch, regardless of its contract.
export const MANDATORY_FORBIDDEN = [".github/**", "scripts/**", "docs/contracts/**"];

// Issue-form heading -> contract key. Headings are the `label`s in
// .github/ISSUE_TEMPLATE/execution-contract.yml; keep the two in sync.
const FIELDS = {
  goal: { key: "goal", kind: "text" },
  successconditions: { key: "successConditions", kind: "list" },
  nongoals: { key: "nonGoals", kind: "list" },
  stopconditions: { key: "stopConditions", kind: "list" },
  allowedpaths: { key: "allowedPaths", kind: "list" },
  requiredevidence: { key: "requiredEvidence", kind: "list" },
  riskclass: { key: "riskClass", kind: "text" },
};
const RISK_CLASSES = new Set(["low", "high", "unknown"]);
const REQUIRED = ["goal", "successConditions", "stopConditions", "allowedPaths", "requiredEvidence"];

function normalizeHeading(text) {
  return text.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z]/g, "");
}

function toList(value) {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "").replace(/^`(.*)`$/, "$1").trim())
    .filter((line) => line.length > 0 && line !== "_No response_" && !line.startsWith("```"));
}

export function parseIssueForm(body, issueNumber) {
  if (!Number.isSafeInteger(issueNumber) || issueNumber <= 0) {
    throw new Error(`invalid issue number: ${issueNumber}`);
  }
  const sections = {};
  let current = null;
  for (const line of String(body).split(/\r?\n/)) {
    const heading = /^###\s+(.+?)\s*$/.exec(line);
    if (heading) {
      const field = FIELDS[normalizeHeading(heading[1])];
      current = field ? field : null;
      if (field) sections[field.key] = [];
      continue;
    }
    if (current) sections[current.key].push(line);
  }

  const contract = {
    version: CONTRACT_VERSION,
    issue: issueNumber,
    goal: "",
    successConditions: [],
    nonGoals: [],
    stopConditions: [],
    allowedPaths: [],
    forbiddenPaths: [...MANDATORY_FORBIDDEN],
    requiredEvidence: [],
    riskClass: "unknown",
  };
  for (const field of Object.values(FIELDS)) {
    const raw = (sections[field.key] ?? []).join("\n").trim();
    if (field.kind === "list") contract[field.key] = toList(raw);
    else contract[field.key] = raw === "_No response_" ? "" : raw;
  }
  contract.riskClass = contract.riskClass.toLowerCase() || "unknown";
  validateContract(contract);
  return contract;
}

function validatePattern(pattern, field) {
  if (typeof pattern !== "string" || pattern.length === 0) throw new Error(`${field}: empty glob`);
  if (pattern.startsWith("/") || pattern.split("/").includes("..") || pattern.includes("\\")) {
    throw new Error(`${field}: glob must be repo-relative without '..' or backslashes: ${pattern}`);
  }
}

export function validateContract(contract) {
  const errors = [];
  for (const key of ["goal", "riskClass"]) if (typeof contract?.[key] !== "string") errors.push(`${key} must be a string`);
  for (const key of ["successConditions", "nonGoals", "stopConditions", "requiredEvidence"]) {
    if (!Array.isArray(contract?.[key]) || contract[key].some((value) => typeof value !== "string" || !value.trim())) errors.push(`${key} must be an array of nonempty strings`);
  }
  if (contract?.version !== CONTRACT_VERSION) errors.push(`version must be ${CONTRACT_VERSION}`);
  if (!Number.isSafeInteger(contract?.issue) || contract.issue <= 0) errors.push("issue must be a positive integer");
  for (const key of REQUIRED) {
    const value = contract?.[key];
    if (Array.isArray(value) ? value.length === 0 : !value) errors.push(`${key} is required`);
  }
  if (!RISK_CLASSES.has(contract?.riskClass)) errors.push(`riskClass must be one of low, high, unknown`);
  for (const key of ["allowedPaths", "forbiddenPaths"]) {
    if (!Array.isArray(contract?.[key])) {
      errors.push(`${key} must be an array`);
      continue;
    }
    for (const pattern of contract[key]) {
      try {
        validatePattern(pattern, key);
      } catch (error) {
        errors.push(error.message);
      }
    }
  }
  for (const pattern of MANDATORY_FORBIDDEN) {
    if (!contract?.forbiddenPaths?.includes(pattern)) errors.push(`forbiddenPaths must include ${pattern}`);
  }
  if (errors.length) throw new Error(`invalid contract:\n  - ${errors.join("\n  - ")}`);
  return contract;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function contractHash(contract) {
  return createHash("sha256").update(canonical(contract)).digest("hex");
}

// Minimal glob: `**` spans directories, `*` and `?` stay inside one segment.
export function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];
    if (ch === "*" && glob[i + 1] === "*") {
      const atSegmentStart = i === 0 || glob[i - 1] === "/";
      if (atSegmentStart && glob[i + 2] === "/") {
        out += "(?:[\\s\\S]*/)?"; // `**/` also matches zero directories
        i += 2;
      } else {
        out += "[\\s\\S]*";
        i += 1;
      }
    } else if (ch === "*") out += "[^/]*";
    else if (ch === "?") out += "[^/]";
    else out += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`);
}

export function matchesAny(file, globs) {
  return globs.some((glob) => globToRegExp(glob).test(file));
}

export function readTrailer(text, name) {
  const pattern = new RegExp(`^${name}:[ \\t]*(\\S+)[ \\t]*$`, "gm");
  const values = [...String(text ?? "").matchAll(pattern)].map((match) => match[1]);
  return values;
}

// Returns a list of human-readable violations; empty means pass.
export function checkChanges(contract, changedFiles, prBody, approval) {
  validateContract(contract);
  const violations = [];
  if (!approval) violations.push("missing base-owned approved contract");
  else {
    validateContract(approval.contract);
    if (contractHash(contract) !== contractHash(approval.contract)) violations.push("committed contract differs from base-owned approved contract");
  }
  for (const file of changedFiles) {
    if (matchesAny(file, HIGH_RISK_PATHS) && contract.riskClass !== "high") violations.push(`${file}: backend/auth paths require riskClass high`);
    if (file === CONTRACT_PATH) continue; // its integrity is bound by the hash trailer below
    if (matchesAny(file, MANDATORY_FORBIDDEN)) violations.push(`${file}: touches a protected path (${MANDATORY_FORBIDDEN.join(", ")})`);
    else if (matchesAny(file, contract.forbiddenPaths)) violations.push(`${file}: matches forbiddenPaths`);
    else if (!matchesAny(file, contract.allowedPaths)) violations.push(`${file}: outside allowedPaths`);
  }
  if (!changedFiles.includes(CONTRACT_PATH)) violations.push(`${CONTRACT_PATH}: must be committed on the PR branch`);
  if (prBody !== undefined) {
    const attempts = readTrailer(prBody, "Factory-Attempt");
    if (approval && (typeof approval.attempt !== "string" || !/^[A-Za-z0-9_-]+$/.test(approval.attempt) || attempts.length !== 1 || attempts[0] !== approval.attempt)) violations.push("Factory-Attempt does not match base-owned approval");
    const hashes = readTrailer(prBody, "Factory-Contract-Hash");
    const expected = contractHash(contract);
    if (hashes.length !== 1) violations.push(`PR body must carry exactly one Factory-Contract-Hash trailer (found ${hashes.length})`);
    else if (hashes[0] !== expected) violations.push(`Factory-Contract-Hash ${hashes[0]} does not match ${CONTRACT_PATH} (${expected})`);
    if (readTrailer(prBody, "Factory-Attempt").length !== 1) violations.push("PR body must carry exactly one Factory-Attempt trailer");
  }
  return violations;
}

export function decodeChangedPaths(buffer) {
  if (!buffer.length) return [];
  if (buffer.at(-1) !== 0) throw new Error("changed paths must be NUL-terminated Git output");
  // Fail closed for invalid UTF-8 rather than replacing bytes in a path.
  const paths = new TextDecoder("utf-8", { fatal: true }).decode(buffer).split("\0");
  paths.pop();
  if (paths.some((path) => !path)) throw new Error("empty changed path");
  return paths;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function main(argv) {
  const [command, ...args] = argv;
  if (command === "from-issue" && args.length === 2) {
    const contract = parseIssueForm(readFileSync(args[0], "utf8"), Number(args[1]));
    process.stdout.write(`${JSON.stringify(contract, null, 2)}\n`);
    return 0;
  }
  if (command === "hash" && args.length === 1) {
    process.stdout.write(`${contractHash(validateContract(readJson(args[0])))}\n`);
    return 0;
  }
  if (command === "guard" && args.length === 4) {
    const contract = readJson(args[0]);
    const changed = decodeChangedPaths(readFileSync(args[1]));
    const prBody = args[2] ? readFileSync(args[2], "utf8") : undefined;
    validateContract(contract);
    const approval = readJson(join(args[3], `${contract.issue}.json`));
    const violations = checkChanges(contract, changed, prBody, approval);
    if (violations.length) {
      for (const violation of violations) console.error(`::error::path-guard: ${violation}`);
      console.error(`path-guard: FAIL (${violations.length} violation(s), ${changed.length} changed file(s))`);
      return 1;
    }
    console.log(`path-guard: PASS (${changed.length} changed file(s), contract ${contractHash(contract)})`);
    return 0;
  }
  console.error("usage: contract.mjs from-issue <body-file> <issue-number> | hash <contract.json> | guard <contract.json> <changed-files> <pr-body-file> <base-approval-directory>");
  return 2;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(`::error::${error.message.replace(/\n/g, "%0A")}`);
    process.exitCode = 1;
  }
}
