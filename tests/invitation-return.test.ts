import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';const {invitationReturn}=createRequire(import.meta.url)('../apps/web/src/lib/invitation-return.ts') as typeof import('../apps/web/src/lib/invitation-return.ts');
test('account-only return allows only bounded same-origin invitation route',()=>{
 const good='/i/'+'a'.repeat(32);assert.equal(invitationReturn(good),good);
 for(const value of [null,'','//evil.test/i/'+ 'a'.repeat(32),'https://evil.test/i/'+ 'a'.repeat(32),'/overview','/i/../overview','/i/%2e%2e','/i/short',good+'?next=evil',good+'#fragment','/i/'+'a'.repeat(201)])assert.equal(invitationReturn(value),null);
});
