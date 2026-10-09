'use client';
import {useState} from 'react';
import type {PublicIntake} from '@painter-os-bts/public-content/qualification';
import type {ContactPolicy} from '@painter-os-bts/public-content/public-lead';
import {IntakeQuestionnaire} from './intake-questionnaire';
/** Stable workspace-keyed boundary: revocation closes new intake, not an existing receipt check. */
export function InquiryExperience({workspace,guidance,contactPolicy}:{workspace:string;guidance:{state:'ready';intake:PublicIntake}|{state:'unavailable'};contactPolicy?:ContactPolicy}) {
  const [pendingGuidance,setPendingGuidance]=useState<PublicIntake|null>(null);
  const policy=pendingGuidance ?? (guidance.state==='ready'?guidance.intake:null);
  if(!policy)return <section className="intake-conversation"><h1>Project guidance is unavailable.</h1><p>This company has not enabled its project guide. Contact the company directly to discuss your project.</p></section>;
  return <>{pendingGuidance && (guidance.state==='unavailable'||!contactPolicy) && <p role="status">New project requests are unavailable. You can still check the receipt for your original request.</p>}<IntakeQuestionnaire policy={policy} workspace={workspace} contactPolicy={guidance.state==='ready'?contactPolicy:undefined} onInquiryLock={()=>setPendingGuidance(policy)}/></>;
}
