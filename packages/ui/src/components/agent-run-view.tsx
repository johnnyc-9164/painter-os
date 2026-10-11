'use client';
import type { PiView } from '@painter-os-bts/domain/agent-run-view';
import { Button } from '@painter-os-bts/ui/components/button';
import { Card, CardContent, CardHeader } from '@painter-os-bts/ui/components/card';

const states = {idle:'Not running',running:'Running',failed:'Run failed',uncertain:'Outcome needs review'};
const toolStates = {pending:'Waiting',running:'Running',recorded:'Result recorded',uncertain:'Outcome unknown'};
/** Controlled display only: never submits, approves, resumes or dispatches tools. */
export function AgentRunView({view,loading=false,error,onRefresh}: {
  view?: PiView; loading?: boolean; error?: string; onRefresh?: ()=>void;
}) {
  return <section aria-label="Agent run view" className="min-w-0 space-y-5 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div><h2 className="text-xl font-semibold tracking-tight">Run activity</h2>
        <p role="status" aria-live="polite" className="mt-1 text-muted-foreground">{loading?'Loading run view…':view?states[view.status]:'No run view loaded'}</p></div>
      {onRefresh&&<Button variant="outline" size="lg" onClick={onRefresh} disabled={loading}>Refresh view</Button>}
    </div>
    {error&&<p role="alert" className="border-l-4 border-destructive bg-destructive/10 p-4 text-foreground">{error} {onRefresh?'Refresh the view to try again.':''}</p>}
    {!view?<div className="min-h-48 py-8 text-muted-foreground">{loading?'Waiting for the run snapshot.':'Load a run snapshot to see messages and tool results.'}</div>:<>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{view.messages.length} persisted messages</span><span aria-hidden="true">·</span><span>{view.queued} queued inputs</span></div>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,.45fr)]">
        <Card className="min-w-0 text-sm"><CardHeader><h3 className="font-semibold">Conversation</h3></CardHeader><CardContent>
          {view.messages.length===0&&!view.provisional?<p className="py-5 text-muted-foreground">No messages in this view.</p>:<ol className="space-y-5">
            {view.messages.map(message=><li key={message.id} data-message-id={message.id} className="min-w-0 border-l-2 border-border pl-4"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{message.role==='user'?'You':'Assistant'}</p><p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.text||'(No visible text)'}</p></li>)}
            {view.provisional&&<li className="min-w-0 border-l-2 border-primary pl-4" data-provisional="true"><p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Assistant · In progress</p><p aria-live="polite" aria-atomic="true" className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{view.provisional.text||'Waiting for visible text…'}</p></li>}
          </ol>}
        </CardContent></Card>
        <Card className="min-w-0 self-start text-sm"><CardHeader><h3 className="font-semibold">Tools</h3><p className="text-xs leading-relaxed text-muted-foreground">A recorded result does not confirm an external action succeeded.</p></CardHeader><CardContent>
          {view.tools.length===0?<p className="py-3 text-muted-foreground">No tool activity.</p>:<ol className="space-y-4">{view.tools.map(tool=><li key={tool.id} data-tool-id={tool.id} className="min-w-0 border-t border-border pt-3"><p className="break-words font-medium [overflow-wrap:anywhere]">{tool.name}</p><p className="mt-1 text-xs text-muted-foreground">{toolStates[tool.status]}</p>{tool.output!==undefined&&<details className="mt-3"><summary className="cursor-pointer text-xs text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring">View tool output</summary><pre className="mt-2 whitespace-pre-wrap break-words font-mono text-xs [overflow-wrap:anywhere]">{tool.output||'(Empty output)'}</pre></details>}</li>)}</ol>}
        </CardContent></Card>
      </div>
    </>}
  </section>;
}
