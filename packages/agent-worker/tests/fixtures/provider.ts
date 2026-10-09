import { createAssistantMessageEventStream } from '@earendil-works/pi-ai/utils/event-stream';
import type { AssistantMessage, Model, TranscriptContext } from '@earendil-works/pi-ai';
import type { Provider } from '@earendil-works/pi-ai/models';

export const model: Model<'openai-completions'> = { id: 'local-fixture', name: 'Deterministic local fixture', api: 'openai-completions', provider: 'local-fixture', baseUrl: 'https://fixture.invalid', input: ['text'], reasoning: false, contextWindow: 4096, maxTokens: 128, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } };

export function fixtureProvider(onCall: () => void, releaseModel = true): Provider {
  const stream = (_model: Model<'openai-completions'>, context: TranscriptContext) => {
    onCall();
    const events = createAssistantMessageEventStream();
    if (!releaseModel && context.messages.some(m => m.role === 'user' && JSON.stringify(m.content).includes('inflight model'))) {
      const partial: AssistantMessage = { role: 'assistant', content: [{ type: 'text', text: 'local partial response' }], api: model.api, provider: model.provider, model: model.id, stopReason: 'pending', timestamp: Date.now(), usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, totalTokens: 2, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } } };
      events.push({ type: 'start', partial });
      events.push({ type: 'text_start', contentIndex: 0, partial });
      events.push({ type: 'text_delta', contentIndex: 0, delta: 'local partial response', partial });
      return events;
    }
    const last = context.messages.at(-1);
    const unsafe = context.messages.some(m => m.role === 'user' && JSON.stringify(m.content).includes('unsafe'));
    const priorCalls = context.messages.filter(m => m.role === 'assistant').length;
    const budgetLoop = context.messages.some(m => m.role === 'user' && JSON.stringify(m.content).includes('budget loop'));
    const finished = !budgetLoop && last?.role === 'toolResult' && (!unsafe || priorCalls >= 2);
    const content = finished ? [{ type: 'text' as const, text: 'fixture completed' }] : [{ type: 'toolCall' as const, id: `fixture-call-${priorCalls}`, name: unsafe ? 'fixture_effect' : 'fixture_read', arguments: {} }];
    const message: AssistantMessage = { role: 'assistant', content, api: model.api, provider: model.provider, model: model.id, stopReason: finished ? 'stop' : 'toolUse', timestamp: Date.now(), usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, totalTokens: 2, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } } };
    events.push({ type: 'start', partial: message });
    events.push({ type: 'done', reason: message.stopReason as 'stop' | 'toolUse', message });
    return events;
  };
  return { id: model.provider, name: 'Local fixture', auth: { apiKey: { name: 'Keyless local fixture', resolve: async () => ({ auth: {} }) } }, getModels: () => [model], stream: stream as Provider['stream'], streamSimple: stream as Provider['streamSimple'] };
}
