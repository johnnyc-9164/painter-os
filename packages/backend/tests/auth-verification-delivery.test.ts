import { afterEach, describe, expect, it, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { betterAuth } from 'better-auth/minimal';
import betterAuthTest from '@convex-dev/better-auth/test';
import agentmailTest from '@agentmail/convex/test';
import workpoolTest from '../../../node_modules/@agentmail/convex/node_modules/@convex-dev/workpool/src/test';
import schema from '../convex/schema';
import { api, type DataModel } from '../convex/runtime';
import type { GenericMutationCtx } from 'convex/server';
import { authComponent } from '../convex/auth';
import { createAuthEmailCallbacks, type AuthEmailDelivery, type AuthEmailMessage } from '../convex/authEmailDelivery';
import { createPreparedAgentMailAuthDelivery, enqueueConfiguredVerification, type ServerVerificationScope } from '../convex/authVerificationDelivery';

const modules = {
  './_generated/test-root-marker.ts': () => Promise.resolve({}),
  './authVerificationDelivery.ts': () => import('../convex/authVerificationDelivery'),
};
const origin = 'https://auth.example.test';
const recipient = 'owner@example.test';
function sandboxAuth(ctx: GenericMutationCtx<DataModel>, delivery: AuthEmailDelivery) {
  return betterAuth({
    baseURL: origin, trustedOrigins: [origin], secret: 'public-test-fixture-secret-at-least-32-characters',
    database: authComponent.adapter(ctx), telemetry: { enabled: false }, logger: { disabled: true },
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    emailVerification: { sendOnSignUp: false, sendVerificationEmail: createAuthEmailCallbacks(delivery).sendVerificationEmail },
  });
}
async function fixture() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  const t = convexTest(schema, modules);
  t.registerComponent('betterAuth', betterAuthTest.schema, {
    ...betterAuthTest.modules,
    './component/adapter.ts': () => import('../../../node_modules/@convex-dev/better-auth/src/component/adapter'),
    './component/_generated/test-root-marker.ts': () => Promise.resolve({}),
  });
  t.registerComponent('agentmail', agentmailTest.schema, {
    ...agentmailTest.modules,
    './component/lib.ts': () => import('../../../node_modules/@agentmail/convex/src/component/lib'),
    './component/_generated/test-root-marker.ts': () => Promise.resolve({}),
  });
  const workpoolModules = {
    ...workpoolTest.modules,
    './component/lib.ts': () => import('../../../node_modules/@agentmail/convex/node_modules/@convex-dev/workpool/src/component/lib'),
    './component/_generated/test-root-marker.ts': () => Promise.resolve({}),
  };
  t.registerComponent('agentmail/sendPool', workpoolTest.schema, workpoolModules);
  t.registerComponent('agentmail/callbackPool', workpoolTest.schema, workpoolModules);
  const userId = await t.runInComponent('betterAuth', ctx => ctx.db.insert('user', { name: 'Fixture owner', email: recipient, emailVerified: false, createdAt: 1, updatedAt: 1 }));
  const scope: ServerVerificationScope = { inboxId: 'synthetic-fixture-inbox', userId, recipient, authOrigin: origin };
  const message: AuthEmailMessage = { purpose: 'verify-email', userId, to: recipient, url: `${origin}/api/auth/verify-email?token=synthetic-core-fixture&callbackURL=%2F` };
  return { t, userId, scope, message };
}
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('prepared official AgentMail auth verification enqueue', () => {
  it('production null scope denies before environment, constructor or queue; reset and untrusted bindings remain held', async () => {
    const { t, scope, message } = await fixture();
    const originalProcess = globalThis.process;
    const providerReads: string[] = [];
    vi.stubGlobal('process', new Proxy(originalProcess, { get(target, key) {
      if (key !== 'env') return Reflect.get(target, key);
      return new Proxy({}, { get(_target, envKey) {
        if (String(envKey).startsWith('AGENTMAIL_')) { providerReads.push(String(envKey)); throw new Error('UNEXPECTED_PROVIDER_ENV_READ'); }
        return undefined;
      } });
    } }));
    try {
      await expect(t.mutation(api.authVerificationDelivery.enqueue, message)).rejects.toMatchObject({ code: 'AGENTMAIL_OUTBOUND_DISABLED' });
      await expect(t.run(ctx => createPreparedAgentMailAuthDelivery(ctx).send(message))).rejects.toMatchObject({ code: 'AGENTMAIL_OUTBOUND_DISABLED' });
      expect(providerReads).toEqual([]);
    } finally { vi.unstubAllGlobals(); }
    await expect(t.run(ctx => enqueueConfiguredVerification(ctx, { ...message, purpose: 'reset-password' }, scope))).rejects.toThrow('AUTH_RESET_DELIVERY_HELD');
    for (const changed of [{ userId: 'foreign' }, { to: 'foreign@example.test' }]) {
      await expect(t.run(ctx => enqueueConfiguredVerification(ctx, { ...message, ...changed }, scope))).rejects.toThrow('AUTH_DELIVERY_RECIPIENT_MISMATCH');
    }
    for (const url of ['https://foreign.example.test/api/auth/verify-email?token=x', `${origin}/wrong?token=x`, `${origin}/api/auth/verify-email?token=x&callbackURL=https%3A%2F%2Fforeign.example.test`, `${message.url}&callbackURL=%2Fduplicate`, `${message.url}&token=duplicate`]) {
      await expect(t.run(ctx => enqueueConfiguredVerification(ctx, { ...message, url }, scope))).rejects.toThrow('INVALID_AUTH_VERIFICATION_LINK');
    }
    expect(await t.run(ctx => ctx.db.query('authEmailBudgets').collect())).toEqual([]);
    expect(await t.run(ctx => ctx.db.query('authEmailReceipts').collect())).toEqual([]);
    const mod = await import('../convex/authVerificationDelivery');
    expect(mod.enqueue.isInternal).toBe(true);
  });

  it('missing-key failure rolls back budget, receipt and official outbound without a provider call', async () => {
    const { t, scope, message } = await fixture();
    vi.stubEnv('AGENTMAIL_API_KEY', '');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(t.run(ctx => enqueueConfiguredVerification(ctx, message, scope))).rejects.toThrow('AGENTMAIL_API_KEY is not set');
    expect(await t.run(ctx => ctx.db.query('authEmailBudgets').collect())).toEqual([]);
    expect(await t.run(ctx => ctx.db.query('authEmailReceipts').collect())).toEqual([]);
    expect(await t.runInComponent('agentmail', ctx => ctx.db.query('outboundMessages').collect())).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('actual official queue deduplicates stable intent without another budget/job and stores one total attempt', async () => {
    const { t, scope, message } = await fixture();
    vi.stubEnv('AGENTMAIL_API_KEY', 'public-synthetic-test-fixture');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const first = await t.run(ctx => enqueueConfiguredVerification(ctx, message, scope));
    const replay = await t.run(ctx => enqueueConfiguredVerification(ctx, message, scope));
    expect(first).toMatchObject({ state: 'queue-accepted', delivery: 'unknown', replayed: false });
    expect(replay).toEqual({ ...first, replayed: true });
    expect(await t.run(ctx => ctx.db.query('authEmailBudgets').unique())).toMatchObject({ count: 1 });
    const receipt = await t.run(ctx => ctx.db.query('authEmailReceipts').unique());
    expect(receipt?.intentHash).toHaveLength(64);
    expect(JSON.stringify(receipt)).not.toContain('synthetic-core-fixture');
    const outbound = await t.runInComponent('agentmail', ctx => ctx.db.query('outboundMessages').collect());
    expect(outbound).toHaveLength(1);
    expect(outbound[0]).toMatchObject({ status: 'pending', inboxId: scope.inboxId, payload: { to: [recipient] } });
    const work = await t.runInComponent('agentmail/sendPool', ctx => ctx.db.query('work').collect());
    expect(work).toHaveLength(1);
    expect(work[0]).toMatchObject({ retryBehavior: { maxAttempts: 1 } });
    await expect(t.run(ctx => enqueueConfiguredVerification(ctx, message, { ...scope, inboxId: 'changed-sender' }))).rejects.toThrow('AUTH_DELIVERY_SCOPE_CONFLICT');
    expect(fetchSpy).not.toHaveBeenCalled();
    // Scheduled provider actions are deliberately not executed. The official queue owns them.
  });

  it('durable fixed-window recipient budget bounds distinct intents and resets after 60 seconds', async () => {
    const { t, scope, message } = await fixture();
    vi.stubEnv('AGENTMAIL_API_KEY', 'public-synthetic-test-fixture');
    for (let i = 0; i < 3; i++) await t.run(ctx => enqueueConfiguredVerification(ctx, { ...message, url: `${message.url}&intent=${i}` }, scope));
    await expect(t.run(ctx => enqueueConfiguredVerification(ctx, { ...message, url: `${message.url}&intent=3` }, scope))).rejects.toThrow('AUTH_EMAIL_RATE_LIMITED');
    expect(await t.run(ctx => ctx.db.query('authEmailReceipts').collect())).toHaveLength(3);
    vi.setSystemTime(Date.now() + 60000);
    await t.run(ctx => enqueueConfiguredVerification(ctx, { ...message, url: `${message.url}&intent=3` }, scope));
    expect(await t.run(ctx => ctx.db.query('authEmailBudgets').unique())).toMatchObject({ count: 1 });
  });

  it('uses actual Better Auth adapter callback identity/link then enqueues actual official message without verifying the account', async () => {
    const { t } = await fixture();
    vi.stubEnv('AGENTMAIL_API_KEY', 'public-synthetic-test-fixture');
    const messages: AuthEmailMessage[] = [];
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await t.run(async ctx => {
      let scope: ServerVerificationScope | null = null;
      const auth = sandboxAuth(ctx, { async send(message) {
        messages.push(message);
        await enqueueConfiguredVerification(ctx, message, scope);
      } });
      const signedUp = await auth.api.signUpEmail({ body: { name: 'SDK owner', email: 'sdk-owner@example.test', password: 'fixture-password-123' }, asResponse: true });
      const owner = await signedUp.json();
      const cookie = signedUp.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
      scope = { inboxId: 'synthetic-fixture-inbox', userId: owner.user.id, recipient: owner.user.email, authOrigin: origin };
      // Actual signed SDK session avoids the anonymous timing-floor timer; no scheduled provider action is flushed.
      await auth.api.sendVerificationEmail({ body: { email: owner.user.email }, headers: new Headers({ cookie }) });
      expect(messages[0]).toMatchObject({ userId: owner.user.id, to: owner.user.email, purpose: 'verify-email' });
      expect(new URL(messages[0]!.url).searchParams.get('token')).toBeTruthy();
      expect((await authComponent.getAnyUserById(ctx, owner.user.id))?.emailVerified).toBe(false);
    });
    expect(await t.run(ctx => ctx.db.query('authEmailReceipts').collect())).toHaveLength(1);
    expect(await t.runInComponent('agentmail', ctx => ctx.db.query('outboundMessages').collect())).toHaveLength(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
