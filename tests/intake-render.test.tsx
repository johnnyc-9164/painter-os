import { test, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IntakeQuestionnaire } from '../apps/company-site/src/components/intake-questionnaire';
import { IntakeSettings } from '../apps/web/src/components/intake-settings';
const policy = {enabled: true, companyName: 'Synthetic Company', revision: 1, servicePostalCodes: ['55401'], supportedProjectTypes: ['interior' as const], consentText: 'Contact consent'};
test('public guide names the company, asks project type and collects no contacts or booking', () => {
  const html = renderToStaticMarkup(createElement(IntakeQuestionnaire, {policy}));
  expect(html).toContain('Synthetic Company'); expect(html).toContain('Question 1 of 4');
  expect(html).toContain('Your answers stay on this page');
  expect(html).not.toMatch(/type="email"|name="phone"|name="name"|Book appointment|Submit request/);
});
test('settings distinguishes forbidden role, local unavailable and cloud loading', () => {
  expect(renderToStaticMarkup(createElement(IntakeSettings, {role: 'crew_member', cloud: true, workspaceId: 'company'}))).toContain('Only company owners');
  expect(renderToStaticMarkup(createElement(IntakeSettings, {role: 'owner', cloud: false, workspaceId: 'company'}))).toContain('local demo does not publish');
  expect(renderToStaticMarkup(createElement(IntakeSettings, {role: 'office_admin', cloud: true, workspaceId: 'company'}))).toContain('Loading saved settings');
});
