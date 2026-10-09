import { describe, expect, it, vi } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/runtime';
vi.mock('../convex/auth', () => ({authComponent: {safeGetAuthUser: async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  return identity ? {_id: identity.subject, name: identity.name, email: identity.email} : null;
}}}));
const modules = {'./_generated/test-root-marker.ts': () => Promise.resolve({}), './intakeConfig.ts': () => import('../convex/intakeConfig'), './painter.ts': () => import('../convex/painter'), './runtime.ts': () => import('../convex/runtime')};
const settings = {enabled: true, servicePostalCodes: ['55401', '55402'], supportedProjectTypes: ['interior' as const], consentText: 'I agree to be contacted about my project.'};
async function setup() {
  const t = convexTest(schema, modules);
  const owner = t.withIdentity({subject: 'owner', name: 'Owner', email: 'owner@example.com'});
  const company = await owner.mutation(api.painter.createWorkspace, {name: 'Painting Company'});
  const other = t.withIdentity({subject: 'other', name: 'Other', email: 'other@example.com'});
  const otherCompany = await other.mutation(api.painter.createWorkspace, {name: 'Other Painting'});
  return {t, owner, company, other, otherCompany};
}
const change = (requestKey = 'configure', expectedRevision = 0) => ({settings, requestKey, expectedRevision});

describe('company-owned intake policy', () => {
  it('defaults unavailable and projects only public policy for the exact existing company', async () => {
    const {t, owner, company, otherCompany} = await setup();
    expect(await t.query(api.intakeConfig.publicPolicy, {workspaceId: company.id})).toEqual({state: 'unavailable'});
    await owner.mutation(api.intakeConfig.configure, change());
    expect(await t.query(api.intakeConfig.publicPolicy, {workspaceId: company.id})).toEqual({state: 'ready', intake: {...settings, companyName: 'Painting Company', revision: 1}});
    expect(await t.query(api.intakeConfig.publicPolicy, {workspaceId: otherCompany.id})).toEqual({state: 'unavailable'});
    expect(await t.query(api.intakeConfig.publicPolicy, {workspaceId: 'bad-id'})).toEqual({state: 'unavailable'});
    await t.run(async ctx => {await ctx.db.delete(company.id);});
    expect(await t.query(api.intakeConfig.publicPolicy, {workspaceId: company.id})).toEqual({state: 'unavailable'});
  });

  it('requires current enabled owner/admin membership before reads, writes, or receipt replay', async () => {
    const {t, owner, company, other, otherCompany} = await setup();
    await expect(t.mutation(api.intakeConfig.configure, change())).rejects.toThrow('UNAUTHENTICATED');
    await expect(other.mutation(api.intakeConfig.configure, {...change(), workspaceId: company.id})).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
    await expect(owner.query(api.intakeConfig.current, {workspaceId: otherCompany.id})).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
    for (const role of ['crew_member', 'salesperson', 'customer']) {
      await t.run(async ctx => {await ctx.db.insert('painterMembers', {tenantId: company.id, userId: role, name: role, email: `${role}@example.com`, role: role as any, enabled: true});});
      const user = t.withIdentity({subject: role, email: `${role}@example.com`});
      await expect(user.mutation(api.intakeConfig.configure, change())).rejects.toThrow('FORBIDDEN');
      await expect(user.query(api.intakeConfig.current, {})).rejects.toThrow('FORBIDDEN');
    }
    await owner.mutation(api.intakeConfig.configure, change());
    await t.run(async ctx => {
      const member = await ctx.db.query('painterMembers').withIndex('by_tenant_user', q => q.eq('tenantId', company.id).eq('userId', 'owner')).unique();
      await ctx.db.patch(member!._id, {enabled: false});
    });
    await expect(owner.mutation(api.intakeConfig.configure, change())).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
  });

  it('supports office-admin configuration, revision protection and actor-bound idempotency', async () => {
    const {t, owner, company} = await setup();
    await t.run(async ctx => {await ctx.db.insert('painterMembers', {tenantId: company.id, userId: 'admin', name: 'Admin', email: 'admin@example.com', role: 'office_admin', enabled: true});});
    const admin = t.withIdentity({subject: 'admin', email: 'admin@example.com'});
    expect(await admin.mutation(api.intakeConfig.configure, change())).toEqual({revision: 1, enabled: true, replayed: false});
    expect(await admin.mutation(api.intakeConfig.configure, change())).toEqual({revision: 1, enabled: true, replayed: true});
    await expect(owner.mutation(api.intakeConfig.configure, change())).rejects.toThrow('IDEMPOTENCY_KEY_CONFLICT');
    await expect(admin.mutation(api.intakeConfig.configure, {...change(), settings: {...settings, consentText: 'Changed'}})).rejects.toThrow('IDEMPOTENCY_KEY_CONFLICT');
    await expect(admin.mutation(api.intakeConfig.configure, change('stale', 0))).rejects.toThrow('REVISION_CONFLICT');
    await admin.mutation(api.intakeConfig.configure, {...change('disable', 1), settings: {...settings, enabled: false}});
    expect(await t.query(api.intakeConfig.publicPolicy, {workspaceId: company.id})).toEqual({state: 'unavailable'});
    expect((await admin.query(api.intakeConfig.current, {}))?.revision).toBe(2);
    await t.run(async ctx => {
      expect(await ctx.db.query('painterIntakeConfigs').collect()).toHaveLength(1);
      expect((await ctx.db.query('painterEvents').collect()).filter(event => event.type === 'intake.configure')).toHaveLength(2);
      expect(await ctx.db.query('painterEntities').collect()).toHaveLength(0);
    });
  });

  it('invalid enabled policy makes no partial configuration, receipt or event write', async () => {
    const {t, owner} = await setup();
    const before = await t.run(async ctx => ({events: (await ctx.db.query('painterEvents').collect()).length, receipts: (await ctx.db.query('painterReceipts').collect()).length}));
    await expect(owner.mutation(api.intakeConfig.configure, {...change(), settings: {...settings, servicePostalCodes: []}})).rejects.toThrow('INTAKE_POLICY_REQUIRED');
    await expect(owner.mutation(api.intakeConfig.configure, {...change(), settings: {...settings, servicePostalCodes: ['bad']}})).rejects.toThrow('INVALID_INTAKE_CONFIG');
    await t.run(async ctx => {
      expect(await ctx.db.query('painterIntakeConfigs').collect()).toHaveLength(0);
      expect((await ctx.db.query('painterEvents').collect()).length).toBe(before.events);
      expect((await ctx.db.query('painterReceipts').collect()).length).toBe(before.receipts);
    });
  });
});
