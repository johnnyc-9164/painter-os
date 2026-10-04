import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const componentDir = path.join(root, 'src', 'component');
const requireGenerated = process.argv.includes('--require-generated');
const errors = [];
const warnings = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.name === '_generated') return [];
    return entry.isDirectory() ? walk(full) : entry.name.endsWith('.ts') ? [full] : [];
  });
}
function rel(file) { return path.relative(root, file).replaceAll('\\', '/'); }
function extractFunctionObject(text, start) {
  const open = text.indexOf('{', start);
  if (open < 0) return '';
  let depth = 0, quote = null, escape = false;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return text.slice(open);
}

const tradeIR = JSON.parse(fs.readFileSync(path.join(root, 'model/trades.ir.json'), 'utf8'));
const componentDirs = [componentDir, ...Object.keys(tradeIR.trades).map(t => path.join(root, 'src/trades', t, 'component'))];
const files = componentDirs.flatMap(walk);
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const code = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
  if (/ctx\.auth\b/.test(code)) errors.push(`${rel(file)}: component code must not use ctx.auth; authenticate in host app`);
  if (/process\.env\.[A-Z0-9_]+/.test(code)) warnings.push(`${rel(file)}: prefer typed generated env over process.env inside component code`);
  if (/from\s+['"][^'"]*(?:examples\/convex|convex\/_generated)[^'"]*['"]/.test(code)) errors.push(`${rel(file)}: imports host/generated app code across the component boundary`);
  for (const line of code.split(/\r?\n/)) {
    if (/ctx\.db.*\.paginate\s*\(/.test(line) && !/paginator\s*\(/.test(line)) {
      errors.push(`${rel(file)}: direct built-in pagination detected; use convex-helpers paginator in components`);
      break;
    }
  }

  const re = /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*(query|mutation|action|httpAction)\s*\(\s*\{/g;
  for (let m; (m = re.exec(text)); ) {
    const body = extractFunctionObject(text, m.index);
    if (!/\bargs\s*:/.test(body)) errors.push(`${rel(file)}:${m[1]} missing args validator`);
    if (!/\breturns\s*:/.test(body)) errors.push(`${rel(file)}:${m[1]} missing return validator`);
  }
}

const configPath = path.join(componentDir, 'convex.config.ts');
const config = fs.readFileSync(configPath, 'utf8');
if (!/defineComponent\s*\(/.test(config)) errors.push('src/component/convex.config.ts: defineComponent() missing');
if (!/MODE\s*:/.test(config) || !/env\s*:/.test(config)) errors.push('src/component/convex.config.ts: typed optional MODE env contract missing');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const key of ['./convex.config.js', './_generated/component.js', './test']) {
  if (!pkg.exports?.[key]) errors.push(`package.json: required component export ${key} missing`);
}
if (!pkg.scripts?.codegen?.includes('--component-dir')) errors.push('package.json: component-local codegen script missing');
if (!pkg.scripts?.['check:component']) errors.push('package.json: check:component script missing');

for (const [trade, definition] of Object.entries(tradeIR.trades)) {
 const dir=path.join(root,'src/trades',trade,'component');
 if (!fs.readFileSync(path.join(dir,'convex.config.ts'),'utf8').includes(`defineComponent("${definition.componentName}")`)) errors.push(`${trade}: incorrect component identity`);
 for (const suffix of ['convex.config','client','test','validators']) {
  const target=pkg.exports?.[`./trades/${trade}/${suffix}`];
  if(!target||!fs.existsSync(path.join(root,target))) errors.push(`${trade}: missing export ${suffix}`);
 }
}
const generated = componentDirs.flatMap(dir => ['component.ts','server.ts','api.ts','dataModel.ts'].map(file=>path.join(dir,'_generated',file)));
const missingGenerated = generated.filter((f) => !fs.existsSync(f)).map(rel);
if (missingGenerated.length) {
  const message = `component generated artifacts absent: ${missingGenerated.join(', ')}`;
  if (requireGenerated) errors.push(message); else warnings.push(`${message}; expected for source checkout before Convex codegen`);
}

const result = {
  status: errors.length ? 'failed' : 'passed',
  checkedComponentFiles: files.length,
  errors,
  warnings,
  requireGenerated,
};
console.log(JSON.stringify(result, null, 2));
if (errors.length) process.exit(1);
