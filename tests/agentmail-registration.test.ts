import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {agentMailRegistration,AgentMailDisabledError,rejectAgentMailOperation}=createRequire(import.meta.url)('../packages/backend/convex/agentmailProvider.ts') as typeof import('../packages/backend/convex/agentmailProvider.ts');

test('registration is immutable, disabled and discloses no configuration',()=>{
 assert.deepEqual(agentMailRegistration,{provider:'agentmail',package:'@agentmail/convex',version:'0.1.0',outbound:'disabled',inboundWebhook:'disabled',incomingActions:'disabled',configuration:'not-checked'});
 assert.ok(Object.isFrozen(agentMailRegistration));
 assert.equal(Reflect.set(agentMailRegistration,'outbound','enabled'),false);
});
test('every provider operation rejects before network, queue or inbound work',()=>{
 const fetch=globalThis.fetch;
 let calls=0;
 globalThis.fetch=async()=>{calls++;throw new Error('provider network must never run');};
 try{
  for(const operation of ['send','reply','forward','createInbox','deleteInbox','remoteRead','webhook','incomingAction'] as const){
   assert.throws(()=>rejectAgentMailOperation(operation),(error:unknown)=>error instanceof AgentMailDisabledError && error.message===error.code);
  }
  assert.equal(calls,0);
 }finally{globalThis.fetch=fetch;}
 const source=readFileSync(new URL('../packages/backend/convex/agentmailProvider.ts',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\bimport\b|process\.env|fetch\(|runAction\(|runMutation\(|scheduler\.|enqueue|new AgentMail\(/);
});
test('official mount and binding preserve existing component owners without exposing provider endpoints',()=>{
 const source=(path:string)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
 assert.deepEqual([...source('packages/backend/convex/convex.config.ts').matchAll(/app\.use\((\w+)\)/g)].map(m=>m[1]),['betterAuth','contractorOs','painting','agentmail']);
 assert.match(source('packages/backend/convex/runtime.ts'),/agentmail: AgentMailComponent/);
 assert.doesNotMatch(source('packages/backend/convex/http.ts'),/agentmail/i);
 const manifest=JSON.parse(source('packages/backend/package.json'));
 const lock=JSON.parse(source('package-lock.json'));
 assert.equal(manifest.dependencies['@agentmail/convex'],'0.1.0');
 assert.equal(lock.packages['packages/backend'].dependencies['@agentmail/convex'],'0.1.0');
 assert.equal(lock.packages['node_modules/@agentmail/convex'].version,'0.1.0');
});
