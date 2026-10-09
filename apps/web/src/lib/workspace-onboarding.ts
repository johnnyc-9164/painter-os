/** Narrow onboarding input: the session, never this payload, establishes ownership. */
export function workspaceName(input: Record<string, unknown>): string {
  for (const key of Object.keys(input)) if (key !== 'name') throw new Error(`UNKNOWN_FIELD:${key}`);
  if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 120) throw new Error('INVALID_NAME');
  return input.name.trim();
}

export interface OnboardingSteps {
  signUp(): Promise<unknown>;
  ensureWorkspace(name: string): Promise<unknown>;
}

/** Retain successful authentication when provisioning needs a retry. Do not load a
 * snapshot until provisioning succeeds: its compatibility path creates a default. */
export function companyOnboarding() {
  let pendingName: string | undefined;
  return {
    pending: () => pendingName !== undefined,
    reset: () => { pendingName = undefined; },
    async submit(name: string, steps: OnboardingSteps) {
      const normalized = workspaceName({ name });
      if (pendingName === undefined) {
        await steps.signUp();
        pendingName = normalized;
      }
      await steps.ensureWorkspace(pendingName);
      pendingName = undefined;
    },
  };
}
