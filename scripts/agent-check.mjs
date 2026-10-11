import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { root } from './agent-common.mjs';

/** Preserve syntax/erasure metadata for narrowly approved type boundaries. */
export function importReferencesIn(source, path = 'source.ts') {
  const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const imports = [];
  function visit(node) {
    let value, kind, typeOnly = false;
    if (ts.isImportDeclaration(node)) {
      value = node.moduleSpecifier; kind = 'import';
      // Only explicit whole-declaration `import type` gets the exception.
      // Parse errors cannot turn malformed source into an approved seam.
      typeOnly = tree.parseDiagnostics.length === 0 && node.importClause?.isTypeOnly === true;
    } else if (ts.isExportDeclaration(node)) {
      value = node.moduleSpecifier; kind = 'export'; typeOnly = node.isTypeOnly;
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      value = node.moduleReference.expression; kind = 'import-equals';
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      value = node.argument.literal; kind = 'type-query';
    } else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === 'require')) {
      value = node.arguments[0]; kind = node.expression.kind === ts.SyntaxKind.ImportKeyword ? 'dynamic' : 'require';
    }
    if (value && ts.isStringLiteralLike(value)) imports.push({specifier: value.text, kind, typeOnly});
    ts.forEachChild(node, visit);
  }
  visit(tree); return imports;
}

/** Existing callers retain the string-only API; policy uses full AST metadata. */
export function importsIn(source, path = 'source.ts') {
  return importReferencesIn(source, path).map(reference => reference.specifier);
}

export function boundaryError(path, specifier, reference = undefined) {
  const owner = path.split('/').slice(0, 2).join('/');
  const target = specifier.startsWith('.') ? relative(root, resolve(root, dirname(path), specifier)).replaceAll('\\', '/') : specifier;
  if (owner === 'apps/marketing' && /^web(?:\/|$)/.test(target) || owner.startsWith('packages/') && /^(?:web|marketing)(?:\/|$)/.test(target)) return 'Application workspace imports are forbidden across this boundary. Use a typed shared package.';
  if (owner === 'apps/marketing') {
    if (/^(?:better-auth|@convex-dev\/better-auth|@painter-os-bts\/domain)(?:\/|$)/.test(target) || /^(?:apps\/web|packages\/domain|packages\/contractor-os-core)(?:\/|$)/.test(target)) return 'Marketing cannot import admin, auth or business authority. Use the published public DTO.';
    if (target.startsWith('@painter-os-bts/backend') && target !== '@painter-os-bts/backend/published-articles.mjs' || target.startsWith('packages/backend/') && target !== 'packages/backend/published-articles.mjs') return 'Marketing backend imports must use published-articles.mjs only.';
  }
  if (owner.startsWith('packages/') && target.startsWith('apps/')) return 'Shared packages cannot depend on application code. Move the typed seam into an existing shared package.';
  if (owner === 'packages/domain' && /^(?:packages\/(?:backend|ui)|@painter-os-bts\/(?:backend|ui))(?:\/|$)/.test(target)) return 'Domain rules cannot depend on backend or UI adapters.';
  if (owner === 'packages/backend' && /^(?:packages\/ui|@painter-os-bts\/ui)(?:\/|$)/.test(target)) return 'Backend cannot depend on UI.';
  const approvedPublicDto = ((path === 'packages/ui/src/components/company-website.tsx' && specifier === '@painter-os-bts/domain/company-website') || (path === 'packages/ui/src/components/agent-run-view.tsx' && specifier === '@painter-os-bts/domain/agent-run-view')) && reference?.kind === 'import' && reference.typeOnly === true;
  if (!approvedPublicDto && owner === 'packages/ui' && /^(?:packages\/(?:backend|domain)|@painter-os-bts\/(?:backend|domain))(?:\/|$)/.test(target)) return 'UI primitives cannot depend on business or backend authority. Accept typed props.';
  return null;
}

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['node_modules', '.next', 'dist', '_generated'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path)); else result.push(path);
  }
  return result;
}

export async function schemaInventory() {
  const path = 'packages/backend/convex/schema.ts';
  const tree = ts.createSourceFile(path, await readFile(join(root, path), 'utf8'), ts.ScriptTarget.Latest, true);
  const tables = [];
  function visit(node) {
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name)) {
      let value = node.initializer;
      while (ts.isCallExpression(value) && ts.isPropertyAccessExpression(value.expression)) value = value.expression.expression;
      if (ts.isCallExpression(value) && ts.isIdentifier(value.expression) && value.expression.text === 'defineTable') tables.push(node.name.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return `# Host schema inventory\n\nGenerated by \`npm run agent:schema\` from [schema.ts](../../${path}). Do not edit manually.\n\nThis lists host tables only; mounted components own separate schemas. It contains no row data and does not establish migration authority.\n\n| Host table | Source |\n| --- | --- |\n${tables.sort().map(name => `| ${name} | schema.ts |`).join('\n')}\n`;
}

export async function checkRepository({ garden = false, writeSchema = false } = {}) {
  const failures = [];
  const manifest = JSON.parse(await readFile(join(root, 'docs/harness.json'), 'utf8'));
  for (const document of manifest.documents) {
    const path = join(root, document.path);
    let source;
    try { source = await readFile(path, 'utf8'); } catch { failures.push(`Missing document ${document.path}; restore or update docs/harness.json.`); continue; }
    if (!document.owner || !/^\d{4}-\d{2}-\d{2}$/.test(document.reviewed)) failures.push(`${document.path}: record owner and reviewed date.`);
    if ((Date.now() - new Date(document.reviewed)) / 86_400_000 > 90) failures.push(`${document.path}: review is older than 90 days; check claims against source before refreshing the date.`);
    for (const match of source.replace(/```[\s\S]*?```/g, '').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const link = match[1].split('#')[0];
      if (!link || /^[a-z]+:/i.test(link)) continue;
      try { await stat(resolve(dirname(path), decodeURIComponent(link))); } catch { failures.push(`${document.path}: missing link ${link}; fix the target or link.`); }
    }
  }
  if ((await readFile(join(root, 'AGENTS.md'), 'utf8')).split('\n').length > 100) failures.push('AGENTS.md exceeds 100 lines; move detailed procedures into docs.');
  const sources = [];
  for (const path of ['apps/marketing/src', 'apps/web/src', 'packages/backend', 'packages/domain/src', 'packages/ui/src']) sources.push(...await files(join(root, path)));
  for (const absolute of sources.filter(path => /\.(?:tsx?|mjs|mts)$/.test(path) && !relative(root, path).replaceAll('\\', '/').includes('/tests/'))) {
    const path = relative(root, absolute).replaceAll('\\', '/');
    const source = await readFile(absolute, 'utf8');
    for (const reference of importReferencesIn(source, path)) {
      const { specifier } = reference;
      const error = boundaryError(path, specifier, reference); if (error) failures.push(`${path}: ${specifier}: ${error}`);
    }
    const lines = source.split('\n').length;
    const limit = manifest.legacySizeLimits[path] || 800;
    if (lines > limit) failures.push(`${path}: ${lines} lines exceeds ${limit}; extract a coherent existing boundary instead of increasing the baseline allowance.`);
  }
  const generated = await schemaInventory();
  const schemaPath = join(root, 'docs/generated/schema.md');
  if (writeSchema) await writeFile(schemaPath, generated);
  else if (await readFile(schemaPath, 'utf8') !== generated) failures.push('Schema inventory is stale. Run npm run agent:schema and review the diff.');
  if (garden) console.log(await readFile(join(root, 'docs/exec-plans/tech-debt-tracker.md'), 'utf8'));
  return failures;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = await checkRepository({ garden: process.argv.includes('--garden'), writeSchema: process.argv.includes('--write-schema') });
  console.log(JSON.stringify({ status: failures.length ? 'failed' : 'passed', failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}
