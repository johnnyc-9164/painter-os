import {readContactPolicy} from '@painter-os-bts/public-content/public-lead';
import { readCompanyIntake } from '../../../lib/intake';
import {InquiryExperience} from '../../../components/inquiry-experience';
export const dynamic = 'force-dynamic';
export default async function ProjectGuidance({params}: {params: Promise<{workspace: string}>}) {
  const {workspace} = await params;
  const result = await readCompanyIntake(workspace);
  const contact = await readContactPolicy(process.env.NEXT_PUBLIC_CONVEX_URL,workspace).catch(()=>({state:'unavailable'} as const));
  return <><a href={`/site/${encodeURIComponent(workspace)}`}>Back to the company journal</a><InquiryExperience key={workspace} workspace={workspace} guidance={result} contactPolicy={contact.state==='ready' && result.state==='ready' && contact.policy.guidanceRevision===result.intake.revision ? contact.policy:undefined}/></>;
}
