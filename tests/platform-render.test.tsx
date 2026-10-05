import { test, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlatformView } from '../apps/web/src/components/platform/platform-view';
const expectMatch = (value: string, pattern: RegExp) => expect(value).toMatch(pattern);
const expectNotMatch = (value: string, pattern: RegExp) => expect(value).not.toMatch(pattern);

test('platform view exposes distinct loading, denied, signed-out, unavailable and empty states', () => {
  const render = (state: Parameters<typeof PlatformView>[0]['result']) => renderToStaticMarkup(createElement(PlatformView, { section: 'workspaces', result: state, onRetry() {}, onSignOut: async () => {} }));
  expectMatch(render({ state: 'loading' }), /Checking platform access/);
  expectMatch(render({ state: 'unauthenticated' }), /Platform sign in/);
  expectMatch(render({ state: 'denied' }), /Platform access required/);
  expectMatch(render({ state: 'unavailable', reason: 'local_runtime' }), /unavailable in local mode/);
  expectMatch(render({ state: 'unavailable', reason: 'backend_unavailable' }), /could not be reached/);
  expectMatch(render({ state: 'ready', items: [], nextCursor: null }), /No workspaces/);
  expectNotMatch(render({ state: 'denied' }), /Create workspace|Start demo|Customer|Revenue/);
});
test('ready inventory and connected detail use only actual summary fields and bounded next cursor', () => {
  const workspace = { id: 'test-workspace', name: 'Actual Test Co.', createdAt: '2026-10-01T12:00:00.000Z', demo: false };
  const html = renderToStaticMarkup(createElement(PlatformView, { section: 'workspaces', result: { state: 'ready', items: [workspace], nextCursor: 'cursor-2' }, onRetry() {}, onSignOut: async () => {} }));
  expectMatch(html, /Actual Test Co\./); expectMatch(html, /\/platform\/workspaces\/test-workspace/); expectMatch(html, /cursor=cursor-2/);
  expectNotMatch(html, /MRR|Revenue|Total workspaces/);
  const detail = renderToStaticMarkup(createElement(PlatformView, { section: 'detail', result: { state: 'ready', workspace }, onRetry() {}, onSignOut: async () => {} }));
  expectMatch(detail, /Actual Test Co\./); expectMatch(detail, /Back to workspaces/); expectMatch(detail, /\/site\/test-workspace/);
});
test('unavailable cursor pages provide a first-page recovery without misreporting a service outage', () => {
  const html = renderToStaticMarkup(createElement(PlatformView, { section: 'workspaces', cursor: 'stale-cursor', result: { state: 'unavailable', reason: 'backend_unavailable' }, onRetry() {}, onSignOut: async () => {} }));
  expectMatch(html, /This inventory page could not be loaded/);
  expectMatch(html, /href="\/platform\/workspaces"[^>]*>Start from first page/);
  expectNotMatch(html, /service could not be reached/);
});
