import type { BetterAuthOptions } from 'better-auth';
import { createAuthEmailCallbacks, disabledAgentMailAuthDelivery } from './authEmailDelivery';

/** Actual SDK wiring, not provider activation. No caller/configuration flag can enable sending.
 * Keep signup/signin usable while delivery is held; explicit requests reach the denied port.
 * Better Auth owns signed verification links and single-use password reset records. */
export function disabledAuthEmailOptions(): Pick<BetterAuthOptions,'emailAndPassword'|'emailVerification'> {
  const callbacks=createAuthEmailCallbacks(disabledAgentMailAuthDelivery);
  return {
    emailAndPassword:{enabled:true,requireEmailVerification:false,sendResetPassword:callbacks.sendResetPassword},
    emailVerification:{sendOnSignUp:false,sendOnSignIn:false,sendVerificationEmail:callbacks.sendVerificationEmail},
  };
}
