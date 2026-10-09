import {test, expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {CompanyWebsiteEditor} from '../apps/web/src/components/company-website-editor';
test('editor distinguishes permission, local demo and real draft loading without fake publication', () => {
  const denied = renderToStaticMarkup(<CompanyWebsiteEditor workspaceId="fixture-company" actorId="fixture-owner" role="crew_member" cloud/>);
  const local = renderToStaticMarkup(<CompanyWebsiteEditor workspaceId="fixture-company" actorId="fixture-owner" role="owner" cloud={false}/>);
  const loading = renderToStaticMarkup(<CompanyWebsiteEditor workspaceId="fixture-company" actorId="fixture-owner" role="owner" cloud/>);
  expect(denied).toContain('Only company owners'); expect(denied).not.toContain('Publish saved draft');
  expect(local).toContain('local demo does not save or publish'); expect(local).not.toContain('Published version');
  expect(loading).toContain('Loading your website draft'); expect(loading).not.toContain('Fixture painting');
});
