import { expect, it } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../convex/schema';
import { api } from '../convex/runtime';

const modules = {'./_generated/test-root-marker.ts': () => Promise.resolve({}), './intakeConfig.ts': () => import('../convex/intakeConfig'), './painter.ts': () => import('../convex/painter'), './runtime.ts': () => import('../convex/runtime')};
const settings = {enabled: true, servicePostalCodes: ['55401'], supportedProjectTypes: ['interior' as const], consentText: 'Contact me about my project.'};

it('actual Better Auth component identity and current membership authorize intake, never identity claims alone', async () => {
  const t = convexTest(schema, modules);
  t.registerComponent('betterAuth', betterAuthTest.schema, {
    ...betterAuthTest.modules,
    './component/adapter.ts': () => import('../../../node_modules/@convex-dev/better-auth/src/component/adapter'),
    './component/_generated/test-root-marker.ts': () => Promise.resolve({}),
  });
  const {userId, sessionId} = await t.runInComponent('betterAuth', async ctx => {
    const userId = await ctx.db.insert('user', {name: 'Company owner', email: 'synthetic@example.test', emailVerified: true, createdAt: 1, updatedAt: 1});
    const sessionId = await ctx.db.insert('session', {userId, token: 'synthetic-intake-session', expiresAt: Date.now() + 60000, createdAt: 1, updatedAt: 1});
    return {userId, sessionId};
  });
  const owner = t.withIdentity({subject: userId, sessionId});
  const company = await owner.mutation(api.painter.createWorkspace, {name: 'Actual identity company'});
  const request = {settings, expectedRevision: 0, requestKey: 'initial', workspaceId: company.id};
  await expect(t.mutation(api.intakeConfig.configure, request)).rejects.toThrow('UNAUTHENTICATED');
  await expect(t.withIdentity({subject: userId, sessionId: 'missing'}).mutation(api.intakeConfig.configure, request)).rejects.toThrow('UNAUTHENTICATED');
  await expect(t.withIdentity({subject: 'forged-user', sessionId}).mutation(api.intakeConfig.configure, request)).rejects.toThrow('UNAUTHENTICATED');
  expect(await owner.mutation(api.intakeConfig.configure, request)).toEqual({enabled: true, revision: 1, replayed: false});
  expect(await owner.query(api.intakeConfig.current, {workspaceId: company.id})).toEqual({...settings, revision: 1});
  await t.run(async ctx => {
    const member = await ctx.db.query('painterMembers').withIndex('by_tenant_user', q => q.eq('tenantId', company.id).eq('userId', userId)).unique();
    await ctx.db.patch(member!._id, {enabled: false});
  });
  await expect(owner.mutation(api.intakeConfig.configure, request)).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
  await expect(owner.query(api.intakeConfig.current, {workspaceId: company.id})).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
  await t.runInComponent('betterAuth', ctx => ctx.db.patch(sessionId, {expiresAt: 0}));
  await expect(owner.mutation(api.intakeConfig.configure, request)).rejects.toThrow('UNAUTHENTICATED');
  await t.run(async ctx => {
    expect(await ctx.db.query('painterIntakeConfigs').collect()).toHaveLength(1);
    expect((await ctx.db.query('painterEvents').collect()).filter(event => event.type === 'intake.configure')).toHaveLength(1);
  });
});
