import type { BetterAuthOptions } from 'better-auth';
import { rejectAgentMailOperation } from './agentmailProvider';

/** The SDK owns the link/token; this boundary owns only delivery. */
export interface AuthEmailMessage {
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

/** Prepared callbacks only: production createAuth deliberately does not install them. */
export function createAuthEmailCallbacks(delivery: AuthEmailDelivery = disabledAgentMailAuthDelivery): {
  sendVerificationEmail: VerifyCallback;
  sendResetPassword: ResetCallback;
} {
  return {
    async sendVerificationEmail({ user, url }) {
      await delivery.send({ purpose: 'verify-email', to: user.email, url });
    },
    async sendResetPassword({ user, url }) {
      await delivery.send({ purpose: 'reset-password', to: user.email, url });
    },
  };
}
