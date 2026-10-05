import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('prepared email callbacks remain absent from production auth and public routes', () => {
  const auth = readFileSync(new URL('../packages/backend/convex/auth.ts', import.meta.url), 'utf8');
  assert.match(auth, /requireEmailVerification:\s*false/);
  assert.doesNotMatch(auth, /authEmailDelivery|sendVerificationEmail|sendResetPassword/);
  const http = readFileSync(new URL('../packages/backend/convex/http.ts', import.meta.url), 'utf8');
  assert.match(http, /authComponent\.registerRoutes\(http,\s*createAuth\)/);
  assert.doesNotMatch(http, /authEmailDelivery|agentmail/i);
});
