import { describe, expect, it } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../convex/schema';
import { api } from '../convex/runtime';

const modules = {
  './_generated/test-root-marker.ts': () => Promise.resolve({}),
  './platformAccess.ts': () => import('../convex/platformAccess'),
};
const email = 'mplsjohnnycage@makeithappenentllc.com';
async function fixture(userEmail = email, emailVerified = true) {
  const t = convexTest(schema, modules);
  // Actual published Better Auth schema/adapter, not an identity lookup mock.
  t.registerComponent('betterAuth', betterAuthTest.schema, {
    ...betterAuthTest.modules,
    './component/adapter.ts': () => import('../../../node_modules/@convex-dev/better-auth/src/component/adapter'),
    './component/_generated/test-root-marker.ts': () => Promise.resolve({}),
  });
  const identity = await t.runInComponent('betterAuth', async ctx => {
    const userId = await ctx.db.insert('user', { name: 'Test owner', email: userEmail, emailVerified, createdAt: 1, updatedAt: 1 });
    const sessionId = await ctx.db.insert('session', { userId, token: 'synthetic-test-only', expiresAt: Date.now() + 60000, createdAt: 1, updatedAt: 1 });
    return { userId, sessionId };
  });
  const user = t.withIdentity({ subject: identity.userId, sessionId: identity.sessionId });
  const args = { userId: identity.userId, requestKey: 'initial-grant', operatorReceiptReference: 'test-only/operator-approval', identityProofReference: 'test-only/identity-proof' };
  return { t, user, args, ...identity };
}

describe('internal audited platform-owner bootstrap', () => {
  it('keeps grants internal and requires actual immutable SDK identity, exact email and verification', async () => {
    const mod = await import('../convex/platformAccess');
    expect(mod.bootstrap.isInternal).toBe(true);
    expect(mod.revoke.isInternal).toBe(true);
    expect(mod.current.isPublic).toBe(true);
    for (const [userEmail, verified, error] of [[email, false, 'PLATFORM_IDENTITY_UNVERIFIED'], ['other@example.test', true, 'PLATFORM_IDENTITY_EMAIL_MISMATCH']] as const) {
      const { t, args } = await fixture(userEmail, verified);
      await expect(t.mutation(api.platformAccess.bootstrap, args)).rejects.toThrow(error);
      expect(await t.run(ctx => ctx.db.query('platformOwners').collect())).toEqual([]);
      expect(await t.run(ctx => ctx.db.query('platformOwnerAudit').collect())).toEqual([]);
    }
    const { t, args } = await fixture();
    await expect(t.mutation(api.platformAccess.bootstrap, { ...args, userId: 'unknown-id' })).rejects.toThrow('PLATFORM_IDENTITY_NOT_FOUND');
    await expect(t.mutation(api.platformAccess.bootstrap, { ...args, operatorId: 'owner' })).rejects.toThrow();
    await expect(t.mutation(api.platformAccess.bootstrap, { ...args, identityProofReference: '' })).rejects.toThrow('INVALID_PLATFORM_RECEIPT');
  });

  it('commits one singleton and immutable audit, handles concurrent duplicate and changed request conflicts', async () => {
    const { t, user, args } = await fixture();
    const results = await Promise.all([t.mutation(api.platformAccess.bootstrap, args), t.mutation(api.platformAccess.bootstrap, args)]);
    expect(results.map(r => r.replayed).sort()).toEqual([false, true]);
    expect(await user.query(api.platformAccess.current, {})).toBe(true);
    expect(await t.query(api.platformAccess.current, {})).toBe(false);
    const original = await t.run(ctx => ctx.db.query('platformOwnerAudit').collect());
    expect(original).toHaveLength(1);
    await expect(t.mutation(api.platformAccess.bootstrap, { ...args, userId: 'changed-target' })).rejects.toThrow('PLATFORM_REQUEST_KEY_CONFLICT');
    await expect(t.mutation(api.platformAccess.bootstrap, { ...args, operatorReceiptReference: 'changed-proof' })).rejects.toThrow('PLATFORM_REQUEST_KEY_CONFLICT');
    await expect(t.mutation(api.platformAccess.bootstrap, { ...args, requestKey: 'second-bootstrap' })).rejects.toThrow('PLATFORM_ALREADY_BOOTSTRAPPED');
    expect(await t.run(ctx => ctx.db.query('platformOwnerAudit').collect())).toEqual(original);
    expect(await t.run(ctx => ctx.db.query('platformOwners').collect())).toHaveLength(1);
  });

  it('revocation appends audit and exact bootstrap replay never reactivates or claims enabled', async () => {
    const { t, user, args } = await fixture();
    await t.mutation(api.platformAccess.bootstrap, args);
    const original = await t.run(ctx => ctx.db.query('platformOwnerAudit').unique());
    const revoke = { userId: args.userId, requestKey: 'revoke-grant', operatorReceiptReference: 'test-only/revoke-approval' };
    expect(await t.mutation(api.platformAccess.revoke, revoke)).toEqual({ enabled: false, replayed: false });
    expect(await t.mutation(api.platformAccess.revoke, revoke)).toEqual({ enabled: false, replayed: true });
    expect(await t.mutation(api.platformAccess.bootstrap, args)).toEqual({ enabled: false, replayed: true });
    expect(await user.query(api.platformAccess.current, {})).toBe(false);
    await expect(t.mutation(api.platformAccess.bootstrap, { ...args, requestKey: 'reactivate' })).rejects.toThrow('PLATFORM_ALREADY_BOOTSTRAPPED');
    await expect(t.mutation(api.platformAccess.revoke, { ...revoke, userId: 'other' })).rejects.toThrow('PLATFORM_REQUEST_KEY_CONFLICT');
    const audit = await t.run(ctx => ctx.db.query('platformOwnerAudit').collect());
    expect(audit).toHaveLength(2);
    expect(audit.find(r => r.action === 'bootstrap')).toEqual(original);
    expect(audit.find(r => r.action === 'revoke')).toMatchObject({ beforeEnabled: true, afterEnabled: false });
  });

  it('tenant owner and invalid/expired sessions confer no platform privilege; response leaks no audit or email', async () => {
    const { t, user, userId, sessionId, args } = await fixture();
    await t.run(async ctx => {
      const tenantId = await ctx.db.insert('painterWorkspaces', { name: 'Tenant', ownerId: userId, createdAt: 'test', demo: false });
      await ctx.db.insert('painterMembers', { tenantId, userId, name: 'Tenant owner', email, role: 'owner', enabled: true });
    });
    expect(await user.query(api.platformAccess.current, {})).toBe(false);
    await t.mutation(api.platformAccess.bootstrap, args);
    expect(await user.query(api.platformAccess.current, {})).toBe(true);
    expect(await t.withIdentity({ subject: userId, sessionId: 'missing-session' }).query(api.platformAccess.current, {})).toBe(false);
    await t.runInComponent('betterAuth', ctx => ctx.db.patch(sessionId, { expiresAt: 0 }));
    expect(await user.query(api.platformAccess.current, {})).toBe(false);
    expect(await t.run(ctx => ctx.db.query('painterMembers').unique())).toMatchObject({ role: 'owner', enabled: true });
  });
});
