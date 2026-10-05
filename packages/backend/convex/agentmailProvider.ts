/** Source registration only. Provider enablement is a separate reviewed change. */
export const agentMailRegistration = Object.freeze({
  provider: 'agentmail',
  package: '@agentmail/convex',
  version: '0.1.0',
  outbound: 'disabled',
  inboundWebhook: 'disabled',
  incomingActions: 'disabled',
  configuration: 'not-checked',
} as const);

export type AgentMailOperation =
  | 'send' | 'reply' | 'forward'
  | 'createInbox' | 'deleteInbox' | 'remoteRead'
  | 'webhook' | 'incomingAction';
export type AgentMailDisabledCode =
  | 'AGENTMAIL_OUTBOUND_DISABLED'
  | 'AGENTMAIL_INBOUND_DISABLED'
  | 'AGENTMAIL_PROVIDER_OPERATIONS_DISABLED';

export class AgentMailDisabledError extends Error {
  readonly code: AgentMailDisabledCode;
  constructor(code: AgentMailDisabledCode) {
    super(code);
    this.code = code;
    this.name = 'AgentMailDisabledError';
  }
}

/** Fail before any SDK, workpool, credentials or external data is accessed. */
export function rejectAgentMailOperation(operation: AgentMailOperation): never {
  const code: AgentMailDisabledCode = ['send', 'reply', 'forward'].includes(operation)
    ? 'AGENTMAIL_OUTBOUND_DISABLED'
    : ['webhook', 'incomingAction'].includes(operation)
      ? 'AGENTMAIL_INBOUND_DISABLED'
      : 'AGENTMAIL_PROVIDER_OPERATIONS_DISABLED';
  throw new AgentMailDisabledError(code);
}
