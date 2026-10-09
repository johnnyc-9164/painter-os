import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { verificationGates } from '../scripts/agent-verification-gates.mjs';
import { assertNoEnvFiles, verificationEnvironment, root } from '../scripts/agent-common.mjs';

test('regular verifier includes every app build before its HTTP acceptance and keeps browser optional', async()=>{
 const gates=await verificationGates({root,npmCli:'/npm-cli'});
 const names=gates.map(([name])=>name);
 for(const [build,http] of [['web-build','http'],['marketing-build','marketing-http'],['company-site-build','company-site-http']]) {
  assert.ok(names.indexOf(build)>=0,build);
  assert.ok(names.indexOf(http)>names.indexOf(build),`${build} precedes ${http}`);
 }
 assert.deepEqual(gates.find(([name])=>name==='company-site-build')[1],['/npm-cli','run','build:company-site']);
 assert.deepEqual(gates.find(([name])=>name==='company-site-http')[1],['/npm-cli','run','test:http:company-site']);
 assert.ok(!names.includes('browser'));
 const withBrowser=await verificationGates({root,npmCli:'/npm-cli',browser:true});
 assert.deepEqual(withBrowser.slice(0,-1),gates);
 assert.equal(withBrowser.at(-1)[0],'browser');
 const runner=await readFile(new URL('../scripts/agent-verify.mjs',import.meta.url),'utf8');
 assert.match(runner,/await verificationGates\(\{ root, npmCli, browser \}\)/);
 assert.match(runner,/for \(const \[name, args\] of gates\)/);
});

test('stable CI build job builds company site before its existing HTTP suite',async()=>{
 const ci=await readFile(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
 const build=ci.slice(ci.indexOf('\n  build:'));
 assert.match(build,/name: build/);
 for(const command of ['npm run build','npm run build:marketing','node scripts/run-http-acceptance.mjs','node scripts/run-marketing-http-acceptance.mjs']) assert.ok(build.includes(`- run: ${command}\n`));
 assert.ok(build.indexOf('- run: npm run build:company-site\n')>build.indexOf('- run: npm run build:marketing\n'));
 assert.ok(build.indexOf('- run: npm run test:http:company-site\n')>build.indexOf('- run: npm run build:company-site\n'));
});

test('company environment filenames are rejected without reading or changing contents',async()=>{
 const fixture=await mkdtemp(join(tmpdir(),'company-gate-env-'));
 try {
  for(const app of ['web','marketing','company-site']) await mkdir(join(fixture,'apps',app),{recursive:true});
  const path=join(fixture,'apps/company-site/.env.production.local');
  await writeFile(path,'SYNTHETIC_SECRET=untouched');
  await assert.rejects(assertNoEnvFiles(fixture),/LOCAL_ENV_FILES_PRESENT.*company-site.*\.env.production.local/);
  assert.equal(await readFile(path,'utf8'),'SYNTHETIC_SECRET=untouched');
  const accessed=[];
  const source=new Proxy({PATH:'/safe'}, {get(target,key){accessed.push(key);return target[key];}});
  assert.equal(verificationEnvironment(source).PATH,'/safe');
  assert.ok(accessed.every(key=>!/(SECRET|TOKEN|CONVEX|KEY)/.test(key)));
 } finally {await rm(fixture,{recursive:true});}
});
