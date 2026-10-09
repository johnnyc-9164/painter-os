import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, readFile, rm, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { verificationGates } from '../scripts/agent-verification-gates.mjs';
import { assertNoEnvFiles, verificationEnvironment, root } from '../scripts/agent-common.mjs';

const priorNames = ['doctor','agent-check','agent-tests','typecheck','lint','domain-tests','node-tests','forms-tests','factory-tests','convex-tests','web-build','compatibility','platform-render','contractor-component','marketing-build','company-site-build','http','marketing-http','company-site-http','platform-http'];
test('default real gates retain all prior order and add fourth-app build/HTTP plus one complete worker gate', async()=>{
 const gates=await verificationGates({root,npmCli:'/npm-cli'});
 const names=gates.map(([name])=>name);
 assert.equal(names.length,23);
 assert.deepEqual(names.filter(name=>priorNames.includes(name)),priorNames);
 for(const [build,http] of [['web-build','http'],['marketing-build','marketing-http'],['company-site-build','company-site-http'],['platform-admin-build','platform-admin-http']]) assert.ok(names.indexOf(build)>=0&&names.indexOf(build)<names.indexOf(http));
 assert.deepEqual(gates.find(([name])=>name==='platform-admin-build')[1],['/npm-cli','run','build:platform-admin']);
 assert.deepEqual(gates.find(([name])=>name==='platform-admin-http')[1],['scripts/run-platform-admin-http-acceptance.mjs']);
 const worker=gates.filter(([,args])=>args.includes('test:agent-worker')||args.includes('build:agent-worker'));
 assert.deepEqual(worker,[['worker-local-runtime',['/npm-cli','run','test:agent-worker']]]);
 const browser=await verificationGates({root,npmCli:'/npm-cli',browser:true});
 assert.deepEqual(browser.slice(0,-1),gates);
 assert.equal(browser.at(-1)[0],'browser');
});

test('stable CI build verifies fourth app separately while domain-tests retain worker-inclusive npm test',async()=>{
 const ci=await readFile(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8');
 const build=ci.slice(ci.indexOf('\n  build:'));
 assert.match(build,/name: build/);
 assert.ok(build.indexOf('- run: npm run build:platform-admin\n')>build.indexOf('- run: npm run build:company-site\n'));
 assert.ok(build.indexOf('- run: node scripts/run-platform-admin-http-acceptance.mjs\n')>build.indexOf('- run: npm run build:platform-admin\n'));
 assert.match(ci,/domain-tests:[\s\S]*?name: domain-tests[\s\S]*?- run: npm test/);
 assert.ok(!ci.includes('npm run build:agent-worker'));
});

test('fourth app and production/fixture Worker config filenames are rejected without reading values',async()=>{
 const fixture=await mkdtemp(join(tmpdir(),'platform-worker-gate-env-'));
 try {
  for(const app of ['web','marketing','company-site','platform-admin']) await mkdir(join(fixture,'apps',app),{recursive:true});
  // Before the worker prerequisite lands, its missing directory must not prevent app checks.
  await assertNoEnvFiles(fixture);
  for(const dir of ['packages/agent-worker','packages/agent-worker/tests/fixtures']) await mkdir(join(fixture,dir),{recursive:true});
  for(const path of ['apps/platform-admin/.env.production.local','packages/agent-worker/.dev.vars','packages/agent-worker/.dev.vars.preview','packages/agent-worker/.env.preview','packages/agent-worker/tests/fixtures/.dev.vars.test']){
   const filename=join(fixture,path);await writeFile(filename,'SYNTHETIC_SECRET=untouched');
   await assert.rejects(assertNoEnvFiles(fixture),/LOCAL_ENV_FILES_PRESENT/);
   assert.equal(await readFile(filename,'utf8'),'SYNTHETIC_SECRET=untouched');await unlink(filename);
  }
  await writeFile(join(fixture,'packages/agent-worker/.dev.vars.example'),'template');await assertNoEnvFiles(fixture);
  const accessed=[];const source=new Proxy({PATH:'/safe'},{get(target,key){accessed.push(key);return target[key];}});
  assert.equal(verificationEnvironment(source).PATH,'/safe');
  assert.ok(accessed.every(key=>!/(SECRET|TOKEN|CONVEX|KEY|HOME|USERPROFILE)/.test(key)));
 } finally {await rm(fixture,{recursive:true});}
});
