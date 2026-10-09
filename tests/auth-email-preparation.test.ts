import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('actual auth installs disabled callbacks while public mail routes and verification policy stay closed', () => {
  const auth = readFileSync(new URL('../packages/backend/convex/auth.ts', import.meta.url), 'utf8');
  assert.match(auth, /disabledAuthEmailOptions/);
  const options=readFileSync(new URL('../packages/backend/convex/authEmailOptions.ts',import.meta.url),'utf8');
  assert.match(options,/requireEmailVerification:\s*false/);
  assert.match(options,/sendOnSignUp:\s*false/);assert.match(options,/sendOnSignIn:\s*false/);
  assert.match(options,/createAuthEmailCallbacks\(disabledAgentMailAuthDelivery\)/);
  const http = readFileSync(new URL('../packages/backend/convex/http.ts', import.meta.url), 'utf8');
  assert.match(http, /authComponent\.registerRoutes\(http,\s*createAuth\)/);
  assert.doesNotMatch(http, /authEmailDelivery|agentmail/i);
});
