import { describe, expect, it, vi } from 'vitest';
import { betterAuth } from 'better-auth/minimal';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { createAuthEmailCallbacks, type AuthEmailDelivery, type AuthEmailMessage } from '../convex/authEmailDelivery';

const baseURL = 'https://auth.example.test';
const email = 'owner@example.test';
const password = 'fixture-password-123';

async function fixture(delivery: AuthEmailDelivery, options: { rateLimit?: boolean; expiresIn?: number } = {}) {
  const callbacks = createAuthEmailCallbacks(delivery);
  const auth = betterAuth({
    baseURL,
    secret: 'public-test-fixture-secret-at-least-32-characters',
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    trustedOrigins: [baseURL],
    logger: { disabled: true },
    telemetry: { enabled: false },
    rateLimit: { enabled: options.rateLimit ?? false, storage: 'memory' },
    advanced: { ipAddress: { ipAddressHeaders: ['x-test-ip'] } },
    emailAndPassword: { enabled: true, requireEmailVerification: false, sendResetPassword: callbacks.sendResetPassword },
    emailVerification: { sendOnSignUp: false, expiresIn: options.expiresIn, sendVerificationEmail: callbacks.sendVerificationEmail },
  });
  const owner = await auth.api.signUpEmail({ body: { name: 'Owner', email, password } });
  const other = await auth.api.signUpEmail({ body: { name: 'Other', email: 'other@example.test', password } });
  return { auth, owner, other };
}

describe('prepared auth email callbacks with the pinned Better Auth SDK', () => {
  it('binds verification delivery and the SDK-signed link to the SDK user', async () => {
    const messages: AuthEmailMessage[] = [];
    const { auth, owner, other } = await fixture({ async send(message) { messages.push(message); } });
    await auth.api.sendVerificationEmail({ body: { email, callbackURL: `${baseURL}/verified` } });
    expect(messages).toHaveLength(1);
    const message = messages[0]!;
    expect(message.to).toBe(owner.user.email);
    expect(message.userId).toBe(owner.user.id);
    expect(message.purpose).toBe('verify-email');
    const link = new URL(message.url);
    expect(link.origin).toBe(baseURL);
    expect(link.pathname).toBe('/api/auth/verify-email');
    expect(link.searchParams.get('callbackURL')).toBe(`${baseURL}/verified`);
    const token = link.searchParams.get('token')!;
    await auth.api.verifyEmail({ query: { token } });
    const context = await auth.$context;
    expect((await context.internalAdapter.findUserById(owner.user.id))?.emailVerified).toBe(true);
    expect((await context.internalAdapter.findUserById(other.user.id))?.emailVerified).toBe(false);
    await expect(auth.api.verifyEmail({ query: { token: `${token}corrupted` } })).rejects.toThrow();
    // SDK verification JWTs are not one-use tokens. Valid replay is an idempotent success.
    expect((await auth.api.verifyEmail({ query: { token } })).status).toBe(true);
    expect((await context.internalAdapter.findUserById(other.user.id))?.emailVerified).toBe(false);
    expect(messages).toHaveLength(1);
  });

  it('rejects SDK-signed expired links and foreign callback origins without verifying any user', async () => {
    const messages: AuthEmailMessage[] = [];
    const { auth, owner, other } = await fixture({ async send(message) { messages.push(message); } }, { expiresIn: 1 });
    await auth.api.sendVerificationEmail({ body: { email } });
    const token = new URL(messages[0]!.url).searchParams.get('token')!;
    await expect(auth.api.verifyEmail({ query: { token, callbackURL: 'https://foreign.example.test/steal' } })).rejects.toThrow();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + 2000);
    try {
      await expect(auth.api.verifyEmail({ query: { token } })).rejects.toMatchObject({ status: 'UNAUTHORIZED' });
      const context = await auth.$context;
      expect((await context.internalAdapter.findUserById(owner.user.id))?.emailVerified).toBe(false);
      expect((await context.internalAdapter.findUserById(other.user.id))?.emailVerified).toBe(false);
    } finally { vi.useRealTimers(); }
  });

  it('executes the SDK HTTP verification 3/60 limiter and demonstrates auth.api bypass is not a durable send budget', async () => {
    const messages: AuthEmailMessage[] = [];
    const { auth } = await fixture({ async send(message) { messages.push(message); } }, { rateLimit: true });
    const request = () => new Request(`${baseURL}/api/auth/send-verification-email`, {
      method: 'POST', headers: { 'content-type': 'application/json', origin: baseURL, 'x-test-ip': '192.0.2.31' }, body: JSON.stringify({ email }),
    });
    for (let i = 0; i < 3; i++) expect((await auth.handler(request())).status).toBe(200);
    const limited = await auth.handler(request());
    expect(limited.status).toBe(429);
    expect(limited.headers.get('retry-after')).not.toBeNull();
    expect(messages).toHaveLength(3);
    await auth.api.sendVerificationEmail({ body: { email } });
    expect(messages).toHaveLength(4);
  });

  it('uses the SDK reset record and consumes it once without changing another recipient', async () => {
    const messages: AuthEmailMessage[] = [];
    const { auth, owner, other } = await fixture({ async send(message) { messages.push(message); } });
    await auth.api.requestPasswordReset({ body: { email, redirectTo: `${baseURL}/reset` } });
    const message = messages[0]!;
    expect(message).toMatchObject({ purpose: 'reset-password', to: owner.user.email });
    const link = new URL(message.url);
    const token = link.pathname.split('/').pop()!;
    expect(link.searchParams.get('callbackURL')).toBe(`${baseURL}/reset`);
    const context = await auth.$context;
    expect((await context.internalAdapter.findVerificationValue(`reset-password:${token}`))?.value).toBe(owner.user.id);
    await expect(auth.api.resetPassword({ body: { token: 'invalid', newPassword: 'new-password-123' } })).rejects.toThrow();
    await auth.api.resetPassword({ body: { token, newPassword: 'new-password-123' } });
    await expect(auth.api.resetPassword({ body: { token, newPassword: 'replayed-password-123' } })).rejects.toThrow();
    await expect(auth.api.signInEmail({ body: { email, password } })).rejects.toThrow();
    expect((await auth.api.signInEmail({ body: { email, password: 'new-password-123' } })).user.id).toBe(owner.user.id);
    expect((await auth.api.signInEmail({ body: { email: other.user.email, password } })).user.id).toBe(other.user.id);
    expect(messages).toHaveLength(1);
  });

  it('does not deliver for an unknown reset recipient or retry a failed send', async () => {
    const send = vi.fn(async () => { throw new Error('TEST_DELIVERY_FAILED'); });
    const { auth } = await fixture({ send });
    await auth.api.requestPasswordReset({ body: { email: 'missing@example.test' } });
    expect(send).not.toHaveBeenCalled();
    // The pinned SDK catches reset delivery errors for anti-enumeration; status is not a delivery receipt.
    expect((await auth.api.requestPasswordReset({ body: { email } })).status).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    send.mockClear();
    // The SDK controls endpoint failure/anti-enumeration behavior; assert the boundary separately.
    await expect(createAuthEmailCallbacks({ send }).sendResetPassword({
      user: (await auth.api.signInEmail({ body: { email, password } })).user,
      url: `${baseURL}/sdk-link`, token: 'sdk-owned-fixture',
    })).rejects.toThrow('TEST_DELIVERY_FAILED');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('keeps SDK endpoint status distinct from disabled delivery and performs no automatic resend', async () => {
    const callbacks = createAuthEmailCallbacks();
    const send = vi.fn(async (message: AuthEmailMessage) => {
      const { disabledAgentMailAuthDelivery } = await import('../convex/authEmailDelivery');
      return disabledAgentMailAuthDelivery.send(message);
    });
    const { auth } = await fixture({ send });
    expect((await auth.api.requestPasswordReset({ body: { email } })).status).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.results[0]!.value).toBeInstanceOf(Promise);
    await expect(send.mock.results[0]!.value).rejects.toMatchObject({ code: 'AGENTMAIL_OUTBOUND_DISABLED' });
    await expect(auth.api.sendVerificationEmail({ body: { email } })).rejects.toMatchObject({ code: 'AGENTMAIL_OUTBOUND_DISABLED' });
    expect(send).toHaveBeenCalledTimes(2);
    await expect(send.mock.results[1]!.value).rejects.toMatchObject({ code: 'AGENTMAIL_OUTBOUND_DISABLED' });
    expect(callbacks).toHaveProperty('sendVerificationEmail');
  });

  it('propagates the existing disabled provider error without fetching or claiming delivery', async () => {
    const callbacks = createAuthEmailCallbacks();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    try {
      const { auth, owner } = await fixture({ async send() {} });
      const data = { user: owner.user, url: `${baseURL}/sdk-link`, token: 'sdk-owned-fixture' };
      await expect(callbacks.sendVerificationEmail(data)).rejects.toMatchObject({ code: 'AGENTMAIL_OUTBOUND_DISABLED' });
      await expect(callbacks.sendResetPassword(data)).rejects.toMatchObject({ code: 'AGENTMAIL_OUTBOUND_DISABLED' });
      expect(fetchSpy).not.toHaveBeenCalled();
      expect((await auth.$context).options.emailAndPassword?.requireEmailVerification).toBe(false);
    } finally { fetchSpy.mockRestore(); }
  });
});
