'use client';
import {useRef,useState} from 'react';
import {Button} from '@painter-os-bts/ui/components/button';
import {Input} from '@painter-os-bts/ui/components/input';
import {Label} from '@painter-os-bts/ui/components/label';
import type {ContactPolicy,PublicContactSubmission} from '@painter-os-bts/public-content/public-lead';
import {createInquiryIntent,exchangeInquiry,reconcileInquiry,type InquiryIntent} from '../lib/inquiry-intent';
export function ContactInquiry({workspace,policy,project,onLock}:{workspace:string;policy:ContactPolicy;project:PublicContactSubmission['project'];onLock:(locked:boolean)=>void}) {
  const [name,setName]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState(''),[consent,setConsent]=useState(false),[intent,setIntent]=useState<InquiryIntent|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const pending=useRef(false);
  async function send(status=false){
    if(pending.current)return;
    let current=intent;
    if(!current){if(!consent)return;try{current=createInquiryIntent({requestKey:crypto.randomUUID().replaceAll('-',''),contactPolicyRevision:policy.contactPolicyRevision,guidanceRevision:policy.guidanceRevision,consent:true,contact:{name,...(email.trim()?{email}:{}),...(phone.trim()?{phone}:{})},project});}catch{setError('Enter your name and a valid email address or phone number.');return;}}
    if(!status && current.phase==='unknown')return;
    pending.current=true;setBusy(true);setError('');setIntent(current);onLock(true);
    let next:InquiryIntent;
    try{next=reconcileInquiry(current,await exchangeInquiry(workspace,status?{action:'status',requestKey:current.submission.requestKey}:{action:'submit',submission:current.submission}),status);}catch{next={...current,phase:'unknown'};}
    setIntent(next);if(next.phase==='denied')setConsent(false);setBusy(false);pending.current=false;
  }
  const proof=intent?.phase==='complete'?intent.result:undefined;
  const denied=intent?.phase==='denied'?intent.result:undefined;
  return <section className="contact-inquiry" aria-labelledby="inquiry-heading"><h2 id="inquiry-heading">Ask {policy.companyName} to review your project</h2>
    <p>Submitting records your contact details and the four project answers above. It does not book an appointment or send a confirmation email.</p>
    {proof?<div role="status"><h3>{proof.state==='received'?'Your request has been recorded.':'Your request already has a receipt.'}</h3><p>{proof.state==='received'?'The company can review your request. No appointment is booked.':proof.state==='deleted'?'The request was deleted. It will not be submitted again.':proof.state==='deletion_pending'?'Deletion is pending. It will not be submitted again.':'The request was converted to a customer record. It will not be submitted again.'}</p></div>:<form onSubmit={event=>{event.preventDefault();void send();}}>
      <fieldset disabled={busy||!!intent}><legend>How can the company reach you?</legend><Label htmlFor="inquiry-name">Full name</Label><Input id="inquiry-name" value={name} onChange={event=>setName(event.target.value)} required maxLength={120} autoComplete="name"/>
      <Label htmlFor="inquiry-email">Email address (email or phone required)</Label><Input id="inquiry-email" type="email" value={email} onChange={event=>setEmail(event.target.value)} maxLength={254} autoComplete="email"/>
      <Label htmlFor="inquiry-phone">Phone number</Label><Input id="inquiry-phone" type="tel" value={phone} onChange={event=>setPhone(event.target.value)} maxLength={40} autoComplete="tel"/>
      <Label className="inquiry-consent"><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)} required/>{policy.consentText}</Label></fieldset>
      <p className="intake-privacy">{policy.retentionDisclosure}</p>
      {error&&<p role="alert">{error}</p>}
      {!intent&&<Button type="submit" disabled={!consent||busy}>Submit project request</Button>}
      {intent?.phase==='unknown'&&<><p role="status">We could not confirm whether your request was recorded. Your original details are held on this page. Check its status before retrying; do not start a second request.</p><Button type="button" disabled={busy} onClick={()=>void send(true)}>Check request status</Button></>}
      {intent?.phase==='checked'&&<><p role="status">No receipt is available yet. The original request may still arrive. You can check again or retry exactly the same request.</p><Button type="button" disabled={busy} onClick={()=>void send(true)}>Check request status</Button><Button type="button" disabled={busy} onClick={()=>void send()}>Retry original request</Button></>}
      {denied?.state==='denied'&&<p role="status">{denied.reason==='policy_changed'?'The company’s consent policy changed. Nothing was accepted by this attempt. Reload this page to review the current policy and consent again.':denied.reason==='global_limit'||denied.reason==='tenant_limit'?'Requests are temporarily limited. This attempt was not accepted. Please return later.':'This attempt was not accepted. Contact the company directly before making another request.'}</p>}
      {busy&&<p role="status">Checking your request…</p>}
    </form>}
    <p className="intake-privacy">Contact details and the submission key stay in this page’s memory. Leaving or refreshing clears that local copy. If the outcome is uncertain, check it here first.</p>
  </section>;
}
