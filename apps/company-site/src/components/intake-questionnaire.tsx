'use client';
import { useEffect, useRef, useState } from 'react';
import { assessQualification, type PublicIntake, type QualificationRecommendation } from '@painter-os-bts/public-content/qualification';
const labels = {eligible_for_follow_up: 'Your project matches the work this company serves.', outside_service_area: 'This ZIP code is outside the company’s listed service area.', unsupported_project: 'This project type is outside the company’s listed work.', needs_review: 'A person will need to review these project details.'};
export function IntakeQuestionnaire({policy}: {policy: PublicIntake}) {
  const [step, setStep] = useState(0), [projectType, setProjectType] = useState(''), [postalCode, setPostalCode] = useState(''), [scope, setScope] = useState(''), [timeline, setTimeline] = useState(''), [result, setResult] = useState<QualificationRecommendation | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => { if (firstRender.current) {firstRender.current = false; return;} heading.current?.focus(); }, [step, result]);
  const questions = ['What kind of painting are you considering?', 'Where is your project?', 'What would you like painted?', 'When are you hoping to start?'];
  function next(event: React.FormEvent) {
    event.preventDefault();
    if (step < 3) setStep(step + 1); else setResult(assessQualification(policy, {projectType, postalCode, scope, timeline}));
  }
  return <section className="intake-conversation" aria-labelledby="project-guidance-heading">
    <h1 id="project-guidance-heading">Let’s understand your painting project.</h1><p className="intake-lead">A few details help you see whether {policy.companyName} is a fit. Keep names, contact details and street addresses out of your answers.</p>
    {result ? <div className="intake-result" role="status"><h2 ref={heading} tabIndex={-1}>{labels[result.outcome]}</h2><p>This is preliminary guidance. Nothing has been sent to the company, and no appointment is booked. Contact the company directly to discuss your project.</p><button type="button" onClick={() => {setResult(null); setStep(0);}}>Review your answers</button></div> : <form onSubmit={next}>
      <p className="intake-step">Question {step + 1} of 4</p><h2 ref={heading} tabIndex={-1}>{questions[step]}</h2>
      {step === 0 && <fieldset><legend className="intake-sr-only">Painting project type</legend>{[['interior', 'Interior painting'], ['exterior', 'Exterior painting'], ['commercial', 'Commercial painting'], ['other', 'Something else']].map(([value, label]) => <label className="intake-choice" key={value}><input type="radio" name="projectType" required value={value} checked={projectType === value} onChange={e => setProjectType(e.target.value)}/>{label}</label>)}</fieldset>}
      {step === 1 && <label>Project ZIP code<input value={postalCode} onChange={e => setPostalCode(e.target.value)} required pattern="[0-9]{5}" maxLength={5} inputMode="numeric" autoComplete="off"/><span>Use a five-digit US ZIP code. We don’t need your street address.</span></label>}
      {step === 2 && <label>Project description<textarea value={scope} onChange={e => setScope(e.target.value)} required maxLength={2000} rows={4}/><span>For example, two bedrooms or the exterior siding. Leave out personal details.</span></label>}
      {step === 3 && <label>Preferred timeframe<select value={timeline} onChange={e => setTimeline(e.target.value)} required><option value="">Choose a timeframe</option><option value="soon">As soon as practical</option><option value="one-to-three-months">In the next 1–3 months</option><option value="later">Later this year</option><option value="flexible">I’m flexible</option></select></label>}
      <div className="intake-controls">{step > 0 && <button type="button" className="intake-back" onClick={() => setStep(step - 1)}>Back</button>}<button type="submit">{step === 3 ? 'See project guidance' : 'Continue'}</button></div>
    </form>}
    <p className="intake-privacy">Your answers stay on this page while you explore. Refreshing clears them. This guide does not send a request or collect contact details.</p>
  </section>;
}
