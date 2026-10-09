'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@painter-os-bts/ui/components/button';
import { validateIntakeSettings, type IntakeProjectType, type SavedIntakeSettings } from '@painter-os-bts/backend/intake-contract';
import { createIntentKeys } from '../lib/command-intent';
import { decodeIntakeRead, decodeIntakeWrite } from '../lib/intake-http';
import './intake-settings.css';
const empty = {enabled: false, servicePostalCodes: [], supportedProjectTypes: [], consentText: '', revision: 0};
async function call(path: string, init?: RequestInit) {
  const response = await fetch(path, {credentials: 'same-origin', ...init});
  let value;
  try { value = await response.json(); } catch { throw new Error('The server response could not be read. Retry or reload saved settings.'); }
  if (!response.ok) throw new Error(response.status === 409 ? 'These settings changed. Reload saved settings before making another change.' : response.status === 403 ? 'Your current role does not allow editing intake settings.' : response.status === 401 ? 'Sign in again to manage intake settings.' : 'Intake settings could not be reached. Your changes have not been confirmed; retry or reload saved settings.');
  return value;
}
export function IntakeSettings({role, cloud, workspaceId}: {role: string; cloud: boolean; workspaceId: string}) {
  const [saved, setSaved] = useState<SavedIntakeSettings | typeof empty>(empty);
  const [zip, setZip] = useState(''), [consent, setConsent] = useState(''), [types, setTypes] = useState<IntakeProjectType[]>([]), [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true), [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const lock = useRef(false), journal = useRef(createIntentKeys());
  const allowed = ['owner', 'office_admin'].includes(role);
  const load = useCallback(async () => {
    setLoading(true); setError(''); setNotice('');
    try {
      const value = decodeIntakeRead(await call(`/api/intake?workspaceId=${encodeURIComponent(workspaceId)}`)) ?? empty;
      setLoaded(true);
      setSaved(value); setZip(value.servicePostalCodes.join(', ')); setConsent(value.consentText); setTypes(value.supportedProjectTypes); setEnabled(value.enabled);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load intake settings.'); }
    finally { setLoading(false); }
  }, [workspaceId]);
  useEffect(() => {if (cloud && allowed) void load(); else setLoading(false);}, [cloud, allowed, load]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (lock.current || !loaded) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const settings = validateIntakeSettings({enabled, servicePostalCodes: zip.split(/[\s,]+/).filter(Boolean), supportedProjectTypes: types, consentText: consent});
      const intent = journal.current.begin(`company-intake:${workspaceId}`, {action: 'intake.configure', expectedRevision: saved.revision, input: settings as unknown as Record<string, unknown>});
      const result = decodeIntakeWrite(await call('/api/intake', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({workspaceId, settings, expectedRevision: saved.revision, requestKey: intent.requestKey})}));
      journal.current.complete(intent); setSaved({...settings, revision: result.revision});
      setNotice(result.enabled ? 'Project guidance is now available on your company site.' : 'Project guidance is turned off.');
    } catch (e) { setError(e instanceof Error && /INVALID_INTAKE|INTAKE_POLICY/.test(e.message) ? 'Add five-digit US ZIP codes, at least one project type, and consent wording before enabling guidance.' : e instanceof Error ? e.message : 'Save failed. Retry with the same settings.'); }
    finally { lock.current = false; setBusy(false); }
  }
  if (!allowed) return <section className="intake-settings"><h2>Company intake</h2><p>Only company owners and office administrators can manage project guidance.</p></section>;
  if (!cloud) return <section className="intake-settings"><h2>Company intake</h2><p>The local demo does not publish intake settings. Open your cloud company workspace to manage project guidance.</p></section>;
  return <section className="intake-settings" aria-labelledby="intake-heading">
    <div className="intake-settings-intro"><h2 id="intake-heading">Help visitors find the right next step</h2><p>Set the work and ZIP codes your company serves. Visitors get project guidance; no contact details are collected and no appointment is booked.</p></div>
    {loading ? <p role="status">Loading saved settings…</p> : <form onSubmit={submit}>
      <fieldset disabled={busy}><legend>Public guidance</legend><label className="intake-toggle"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}/> Enable project guidance on the company site</label><p>Off until you choose to enable it.</p></fieldset>
      <fieldset disabled={busy}><legend>Work you take on</legend><div className="intake-type-options">{(['interior', 'exterior', 'commercial'] as IntakeProjectType[]).map(type => <label key={type}><input type="checkbox" checked={types.includes(type)} onChange={e => setTypes(e.target.checked ? [...types, type] : types.filter(item => item !== type))}/>{type.charAt(0).toUpperCase() + type.slice(1)} painting</label>)}</div></fieldset>
      <label className="intake-field">Service ZIP codes<textarea value={zip} onChange={e => setZip(e.target.value)} rows={3} disabled={busy} aria-describedby="intake-zip-help"/><span id="intake-zip-help">Five-digit US ZIP codes, separated by commas or spaces. Up to 200.</span></label>
      <label className="intake-field">Consent wording for future contact intake<textarea value={consent} onChange={e => setConsent(e.target.value)} rows={3} maxLength={1000} disabled={busy}/><span>This wording is saved for the later contact-intake step. This page collects no visitor contacts.</span></label>
      {error && <p className="intake-form-error" role="alert">{error}</p>}{notice && <p role="status" className="intake-form-success">{notice}</p>}
      <div className="intake-settings-actions"><Button type="submit" disabled={busy || !loaded}>{busy ? 'Saving…' : 'Save intake settings'}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void load()}>Reload saved settings</Button><span>Saved version {saved.revision}</span></div>
    </form>}
  </section>;
}
