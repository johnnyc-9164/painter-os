import { expect, it, vi } from 'vitest';
import { convexTest } from 'convex-test';
import schema from '../convex/schema';
import { api } from '../convex/runtime';
vi.mock('../convex/auth', () => ({ authComponent: { safeGetAuthUser: async (ctx: any) => {
  const user = await ctx.auth.getUserIdentity();
  return user ? { _id: user.subject, name: user.name, email: user.email } : null;
} } }));
const modules = { './_generated/test-root-marker.ts': () => Promise.resolve({}), './painter.ts': () => import('../convex/painter'), './runtime.ts': () => import('../convex/runtime') };

it('existing atomic onboarding writer creates company once and reuses without renaming', async () => {
  const t = convexTest(schema, modules);
  await expect(t.mutation(api.painter.createWorkspace, { name: 'Acme', onlyIfNone: true })).rejects.toThrow('UNAUTHENTICATED');
  const owner = t.withIdentity({ subject: 'owner', name: 'Alex', email: 'alex@example.com' });
  const first = await owner.mutation(api.painter.createWorkspace, { name: 'Acme Painting', onlyIfNone: true });
  const replay = await owner.mutation(api.painter.createWorkspace, { name: 'Different', onlyIfNone: true });
  expect(replay).toEqual(first);
  expect((await owner.query(api.painter.snapshot, {})).workspace.name).toBe('Acme Painting');
  await t.run(async ctx => {
    expect(await ctx.db.query('painterWorkspaces').collect()).toHaveLength(1);
    const members = await ctx.db.query('painterMembers').collect();
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({ userId: 'owner', tenantId: first.id, role: 'owner', enabled: true });
    expect(await ctx.db.query('painterEvents').collect()).toHaveLength(1);
  });
});
