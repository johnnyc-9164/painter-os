'use client';
import { useEffect, useState } from 'react';
import { Button } from '@painter-os-bts/ui/components/button';
import { CONTACT_RETENTION_DISCLOSURE, decodeContactPreview, previewState, type ContactPreview } from '../lib/contact-intake-http';

type Load = {kind: 'loading'} | {kind: 'error'; message: string} | {kind: 'ready'; preview: ContactPreview};
const typeLabel = {interior: 'Interior painting', exterior: 'Exterior painting', commercial: 'Commercial painting'} as const;

/** Read-only view of the saved public projections behind /estimate-request/[workspace]; it never reflects unsaved edits and writes nothing. */
export function ContactIntakePreview({workspaceId, revision}: {workspaceId: string; revision: number}) {
  const [load, setLoad] = useState<Load>({kind: 'loading'}), [nonce, setNonce] = useState(0);
  useEffect(() => {
    let live = true;
    setLoad({kind: 'loading'});
    (async () => {
      try {
        const response = await fetch(`/api/contact-intake/preview?workspaceId=${encodeURIComponent(workspaceId)}`, {credentials: 'same-origin'});
        if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Your current role or session does not allow viewing this preview.' : 'The public preview could not be loaded. This does not mean the public form is unavailable.');
        const preview = decodeContactPreview(await response.json());
        if (live) setLoad({kind: 'ready', preview});
      } catch (e) {
        if (live) setLoad({kind: 'error', message: e instanceof Error && /^Your current|^The public/.test(e.message) ? e.message : 'The public preview could not be loaded. This does not mean the public form is unavailable.'});
      }
    })();
    return () => { live = false; };
  }, [workspaceId, revision, nonce]);
  const href = `/estimate-request/${encodeURIComponent(workspaceId)}`;
  return <section className="contact-intake-preview" aria-labelledby="contact-preview-heading">
    <h3 id="contact-preview-heading">Public form preview</h3>
    <p>Shows the saved policies that <code>{href}</code> uses. Unsaved edits above are not included.</p>
    {load.kind === 'loading' && <p role="status">Loading public preview…</p>}
    {load.kind === 'error' && <><p className="contact-intake-error" role="alert">{load.message}</p><Button type="button" variant="outline" onClick={() => setNonce(n => n + 1)}>Retry preview</Button></>}
    {load.kind === 'ready' && (() => {
      const {preview} = load, state = previewState(preview);
      return <div data-preview-state={state}>
        <p role="status" className="contact-preview-state">{state === 'public' ? 'Visitors can open the project guide, and the saved contact policy is ready.' : state === 'guidance_off' ? 'The public form is unavailable: project guidance is not enabled. Visitors see “Project guidance is unavailable.”' : 'The contact policy is off or not saved, so contact collection is closed even though project guidance is available.'}</p>
        {preview.guidance.state === 'ready' && <div className="contact-preview-card">
          <h4>Project guidance (visitor view)</h4>
          <p>A few details help you see whether {preview.guidance.intake.companyName} is a fit.</p>
          <p>Work offered: {preview.guidance.intake.supportedProjectTypes.map(t => typeLabel[t]).join(', ')}.</p>
          <p>Service ZIP codes: {preview.guidance.intake.servicePostalCodes.join(', ')}.</p>
        </div>}
        {preview.contact.state === 'ready' && <div className="contact-preview-card">
          <h4>Contact consent (visitor view)</h4>
          <p>{preview.contact.policy.consentText}</p>
          <p className="contact-intake-disclosure">{CONTACT_RETENTION_DISCLOSURE}</p>
          <p>The public page does not yet show contact fields; this saved wording is what they will use. Nothing is sent, booked or activated by this preview.</p>
        </div>}
        {state !== 'public' && <p>Enable both project guidance and contact collection, and save, for the contact policy to be public.</p>}
        <Button type="button" variant="outline" onClick={() => setNonce(n => n + 1)}>Refresh preview</Button>
      </div>;
    })()}
  </section>;
}
