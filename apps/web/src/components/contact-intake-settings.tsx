'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@painter-os-bts/ui/components/button';
import { createIntentKeys } from '../lib/command-intent';
import { CONTACT_RETENTION_DISCLOSURE, classifyContactFailure, decodeContactRead, decodeContactWrite, type ContactFailure, type SavedContactIntake } from '../lib/contact-intake-http';
import './contact-intake-settings.css';

class ContactCallError extends Error { constructor(message: string, readonly failure: ContactFailure) { super(message); } }
const absent: SavedContactIntake = {enabled: false, consentText: '', acknowledgeRetention: false, revision: 0};
const messages: Record<ContactFailure, string> = {
  conflict: 'These settings changed elsewhere. Your edits are kept below; use Reload saved settings to replace them with the saved version.',
  auth: 'Your current role or session does not allow managing contact collection. Sign in again or ask an owner.',
  invalid: 'Add consent wording (up to 1000 characters) and acknowledge the 30-day retention before enabling contact collection.',
  unknown: 'The result could not be confirmed. Saving again resends the identical change safely, or reload saved settings to check.',
};
async function call(path: string, init?: RequestInit) {
  let response: Response;
  try { response = await fetch(path, {credentials: 'same-origin', ...init}); } catch { throw new ContactCallError(messages.unknown, 'unknown'); }
  let value: unknown;
  try { value = await response.json(); } catch { throw new ContactCallError(messages.unknown, 'unknown'); }
  if (!response.ok) { const failure = classifyContactFailure(response.status); throw new ContactCallError(messages[failure], failure); }
  return value;
}

export function ContactIntakeSettings({workspaceId}: {workspaceId: string}) {
  const [saved, setSaved] = useState<SavedContactIntake>(absent);
  const [enabled, setEnabled] = useState(false), [consent, setConsent] = useState(''), [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(true), [loaded, setLoaded] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const lock = useRef(false), journal = useRef(createIntentKeys());
  const load = useCallback(async () => {
    setLoading(true); setError(''); setNotice('');
    try {
      const value = decodeContactRead(await call(`/api/contact-intake?workspaceId=${encodeURIComponent(workspaceId)}`)) ?? absent;
      setSaved(value); setEnabled(value.enabled); setConsent(value.consentText); setAck(value.acknowledgeRetention); setLoaded(true);
    } catch (e) {
      if (e instanceof ContactCallError && e.failure === 'auth') journal.current = createIntentKeys();
      setError(e instanceof ContactCallError ? e.message : 'Saved contact settings could not be read. Reload to retry.');
    } finally { setLoading(false); }
  }, [workspaceId]);
  // Read-only on mount; absent policy means disabled and nothing is written.
  useEffect(() => { journal.current = createIntentKeys(); setLoaded(false); void load(); }, [load]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (lock.current || !loaded) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const settings = {enabled, consentText: consent.trim(), acknowledgeRetention: ack};
      if (enabled && (!settings.consentText || !ack)) throw new ContactCallError(messages.invalid, 'invalid');
      if (settings.consentText.length > 1000) throw new ContactCallError(messages.invalid, 'invalid');
      const intent = journal.current.begin(`contact-intake:${workspaceId}`, {action: 'contact_intake.configure', expectedRevision: saved.revision, input: settings as unknown as Record<string, unknown>} as never);
      const result = decodeContactWrite(await call('/api/contact-intake', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({workspaceId, settings, expectedRevision: saved.revision, requestKey: intent.requestKey})}));
      journal.current.complete(intent);
      setSaved({...settings, revision: result.revision});
      setNotice(result.enabled ? 'Contact collection is enabled.' : 'Contact collection is turned off. Existing requests and receipts are unchanged.');
    } catch (e) {
      if (e instanceof ContactCallError) {
        if (e.failure === 'auth') journal.current = createIntentKeys();
        setError(e.message);
      } else setError(messages.unknown);
    } finally { lock.current = false; setBusy(false); }
  }
  return <section className="contact-intake-settings" aria-labelledby="contact-intake-heading">
    <h2 id="contact-intake-heading">Contact requests</h2>
    <p>Separate from project guidance. The public form needs BOTH real project guidance and this contact policy; enabling guidance never enables contact collection. Saving here books no appointment and activates no notification, provider, calendar, account or credential.</p>
    {loading ? <p role="status">Loading saved contact settings…</p> : <form onSubmit={submit}>
      <fieldset disabled={busy}><legend>Contact collection</legend>
        <label className="contact-intake-toggle"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}/> Collect contact requests on the company site</label>
        <p>{saved.revision === 0 ? 'No policy saved yet: contact collection is off.' : saved.enabled ? 'Saved policy: on.' : 'Saved policy: off.'} Turning it off is a save you confirm below; it does not delete existing requests or receipts.</p>
      </fieldset>
      <label className="contact-intake-field">Company consent wording<textarea value={consent} onChange={e => setConsent(e.target.value)} rows={3} maxLength={1000} disabled={busy}/><span>Required to enable. {consent.length}/1000 characters.</span></label>
      <fieldset disabled={busy}><legend>Retention</legend>
        <p className="contact-intake-disclosure">{CONTACT_RETENTION_DISCLOSURE}</p>
        <label className="contact-intake-toggle"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)}/> I acknowledge this 30-day retention disclosure</label>
      </fieldset>
      {error && <p className="contact-intake-error" role="alert">{error}</p>}{notice && <p role="status" className="contact-intake-success">{notice}</p>}
      <div className="contact-intake-actions"><Button type="submit" disabled={busy || !loaded}>{busy ? 'Saving…' : enabled ? 'Save and enable contact collection' : 'Save contact settings (off)'}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => void load()}>Reload saved settings</Button><span>Saved version {saved.revision}</span></div>
    </form>}
  </section>;
}
