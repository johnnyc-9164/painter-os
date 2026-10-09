import { readCompanyIntake } from '../../../lib/intake';
import { IntakeQuestionnaire } from '../../../components/intake-questionnaire';
export const dynamic = 'force-dynamic';
export default async function ProjectGuidance({params}: {params: Promise<{workspace: string}>}) {
  const {workspace} = await params;
  const result = await readCompanyIntake(workspace);
  return <><a href={`/site/${encodeURIComponent(workspace)}`}>Back to the company journal</a>{result.state === 'ready' ? <IntakeQuestionnaire policy={result.intake}/> : <section className="intake-conversation"><h1>Project guidance is unavailable.</h1><p>This company has not enabled its project guide. Contact the company directly to discuss your project.</p></section>}</>;
}
