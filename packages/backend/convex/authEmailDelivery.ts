import type { BetterAuthOptions } from 'better-auth';
import { rejectAgentMailOperation } from './agentmailProvider';

/** The SDK owns the link/token; this boundary owns only delivery. */
export interface AuthEmailMessage {
  readonly userId: string;
  readonly purpose: 'verify-email' | 'reset-password';
  readonly to: string;
  readonly url: string;
}

export interface AuthEmailDelivery {
  send(message: AuthEmailMessage): Promise<void>;
}

export const disabledAgentMailAuthDelivery: AuthEmailDelivery = Object.freeze({
  async send(_message: AuthEmailMessage): Promise<void> {
    rejectAgentMailOperation('send');
  },
});

type VerifyCallback = NonNullable<NonNullable<BetterAuthOptions['emailVerification']>['sendVerificationEmail']>;
type ResetCallback = NonNullable<NonNullable<BetterAuthOptions['emailAndPassword']>['sendResetPassword']>;

/** Typed SDK callbacks: production installs these with the hard-disabled delivery port. */
export function createAuthEmailCallbacks(delivery: AuthEmailDelivery = disabledAgentMailAuthDelivery): {
  sendVerificationEmail: VerifyCallback;
  sendResetPassword: ResetCallback;
} {
  return {
    async sendVerificationEmail({ user, url }) {
      await delivery.send({ purpose: 'verify-email', userId: user.id, to: user.email, url });
    },
    async sendResetPassword({ user, url }) {
      await delivery.send({ purpose: 'reset-password', userId: user.id, to: user.email, url });
    },
  };
}
