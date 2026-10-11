import {test,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {AgentRunView} from '../packages/ui/src/components/agent-run-view';
import type {PiView} from '@painter-os-bts/domain/agent-run-view';
const empty:PiView={status:'idle',messages:[],tools:[],queued:0};
test('shared renderer distinguishes loading, empty, error, running, failed and uncertain states',()=>{
 expect(renderToStaticMarkup(<AgentRunView loading/>)).toContain('Loading run view');
 expect(renderToStaticMarkup(<AgentRunView view={empty}/>)).toContain('No messages in this view');
 expect(renderToStaticMarkup(<AgentRunView view={empty} error="View unavailable" onRefresh={()=>{}}/>)).toContain('role="alert"');
 for(const [status,label]of [['running','Running'],['failed','Run failed'],['uncertain','Outcome needs review']] as const)expect(renderToStaticMarkup(<AgentRunView view={{...empty,status}}/>)).toContain(label);
});
test('transcript/output are escaped; unknown tool outcome never becomes approval or confirmed effect',()=>{
 const view:PiView={...empty,status:'uncertain',messages:[{id:'m',role:'assistant',text:'<script>unsafe()</script>'}],provisional:{id:'p',text:'partial'},tools:[{id:'t',name:'fixture_effect',status:'uncertain',output:'<b>dispatching</b>'}]};
 const html=renderToStaticMarkup(<AgentRunView view={view} onRefresh={()=>{}}/>);
 expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>unsafe');expect(html).toContain('Outcome unknown');expect(html).toContain('does not confirm an external action');expect(html).not.toContain('Approve');expect(html).toContain('data-slot="button"');expect(html).toContain('data-slot="card"');
});
