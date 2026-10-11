'use client';
import {useEffect,useRef,useState} from 'react';
import type {PiView} from '@painter-os-bts/domain/agent-run-view';
import {AgentRunView} from '@painter-os-bts/ui/components/agent-run-view';
import {Button} from '@painter-os-bts/ui/components/button';
import {consumeView,type Encoding} from '../lib/view-stream';
const examples=[['completed','Completed run'],['running','Running response'],['interrupted','Interrupted effect'],['empty','Empty view'],['gap','Connection gap'],['slow','Slow snapshot'],['failure','Failed request']] as const;
export default function Page(){
 const [encoding,setEncoding]=useState<Encoding>('direct');const [scenario,setScenario]=useState('completed');const [retry,setRetry]=useState(0);const [recoverGap,setRecoverGap]=useState(false);
 const [view,setView]=useState<PiView>();const [loading,setLoading]=useState(true);const [error,setError]=useState<string>();const [settledKey,setSettledKey]=useState('');const generation=useRef(0);
 useEffect(()=>{
  const controller=new AbortController();const id=++generation.current;setSettledKey('');setLoading(true);setError(undefined);setView(undefined);
  const load=async()=>{try{const response=await fetch(`/api/local-pi-view?encoding=${encoding}&scenario=${scenario}&fresh=${recoverGap?'yes':'no'}`,{signal:controller.signal,cache:'no-store'});
   await consumeView(response,encoding,frame=>{if(id===generation.current&&!controller.signal.aborted)setView(frame.view);});
  }catch(cause){if(!controller.signal.aborted&&id===generation.current)setError(cause instanceof Error&&cause.message==='VIEW_SNAPSHOT_REQUIRED'?'The connection missed an update. A fresh snapshot is needed.':'The run view is unavailable.');}
  finally{if(!controller.signal.aborted&&id===generation.current){setLoading(false);setSettledKey(`${encoding}/${scenario}/${retry}/${recoverGap}`);}}};
  void load();return()=>controller.abort();
 },[encoding,scenario,retry,recoverGap]);
 return <main className="fixture-shell" id="run-view" data-selected-context={`${encoding}/${scenario}/${retry}/${recoverGap}`} data-settled-context={settledKey}>
  <p className="fixture-mode">PAINTER OS / LOCAL PROTOCOL FIXTURE</p><h1 className="fixture-heading">One run. Two views.</h1>
  <p className="fixture-note">Compare two encodings of the same locally captured Pi run. These controls change the example shown; they do not submit work or approve actions.</p>
  <div className="fixture-controls" role="group" aria-label="View encoding">{(['direct','ag-ui'] as const).map(mode=><Button key={mode} aria-pressed={encoding===mode} variant={encoding===mode?'default':'outline'} size="lg" onClick={()=>{setRecoverGap(false);setEncoding(mode);}}>{mode==='direct'?'Direct SSE':'AG-UI'}</Button>)}</div>
  <div className="fixture-controls" role="group" aria-label="Local run example">{examples.map(([id,label])=><Button key={id} aria-pressed={scenario===id} variant={scenario===id?'secondary':'ghost'} onClick={()=>{setRecoverGap(false);setScenario(id);}}>{label}</Button>)}</div>
  {scenario==='interrupted'&&<p className="fixture-note" data-ledger-note="true">Local fake-effect ledger: dispatching. The interrupted fixture has no confirmed effect receipt.</p>}
  <div className="fixture-view"><AgentRunView view={view} loading={loading} error={error} onRefresh={()=>{setRecoverGap(true);setRetry(value=>value+1);}}/></div>
 </main>;
}
