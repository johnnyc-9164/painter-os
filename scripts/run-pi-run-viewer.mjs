import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {readdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {root,createRun,unusedPort,assertNoEnvFiles,verificationEnvironment,gitState} from './agent-common.mjs';
import {assertNoLegacyWranglerConfig,workerGateEnvironment} from './agent-worker-gate.mjs';
import {observe,stop,waitForHarness} from './run-http-acceptance.mjs';
const fixture=join(root,'tests/fixtures/pi-run-viewer');
export async function assertFixtureEnvFiles(directory=fixture){const names=await readdir(directory);if(names.some(name=>/^\.env(?:\..+)?$/.test(name)&&!name.endsWith('.example')))throw new Error('FIXTURE_ENV_FILES_PRESENT: filenames only; files were not read or changed.');}
export function piViewerEnvironment(source,path){return {...verificationEnvironment(source),PI_VIEW_FIXTURE_FILE:path};}
async function run(args,cwd,env,limit=120000){const child=spawn(process.execPath,args,{cwd,env,stdio:'inherit',shell:false});const state=observe(child);let interrupted=false;const interrupt=()=>{interrupted=true;void stop(child,state).catch(()=>{});};process.once('SIGINT',interrupt);process.once('SIGTERM',interrupt);try{await waitForHarness(state,limit);if(interrupted)throw new Error('VIEWER_INTERRUPTED');}finally{process.removeListener('SIGINT',interrupt);process.removeListener('SIGTERM',interrupt);await stop(child,state);}}
async function ready(base,state){const deadline=Date.now()+45000;while(Date.now()<deadline){if(state.ended)throw new Error('VIEWER_EXITED_BEFORE_READY');try{if((await fetch(base,{signal:AbortSignal.timeout(500)})).status===200)return;}catch{}await new Promise(resolve=>setTimeout(resolve,100));}throw new Error('VIEWER_READINESS_TIMEOUT');}
export async function runPiViewer(browser=false,capture=false){
 await assertNoEnvFiles();await assertFixtureEnvFiles();await assertNoLegacyWranglerConfig();
 const directory=await createRun('pi-viewer');const source=gitState();const npmBin=process.env.npm_execpath;
 if(!npmBin)throw new Error('NPM_EXEC_PATH_REQUIRED');
 await run(['--test',join(root,'tests/pi-run-viewer-harness.test.mjs')],root,verificationEnvironment());
 await run([join(root,'node_modules/vitest/vitest.mjs'),'run','--config','vitest.pi-viewer.config.ts'],root,verificationEnvironment());
 const workerEnv=workerGateEnvironment('worker-local-runtime',verificationEnvironment(),directory);
 await run([npmBin,'run','build:fixture','--workspace','@painter-os-bts/agent-worker'],root,workerEnv);
 await run([join(fixture,'prepare.mjs'),directory],root,workerEnv);
 const env=piViewerEnvironment(process.env,join(directory,'pi-view-frames.json'));const next=createRequire(import.meta.url).resolve('next/dist/bin/next');
 await run([next,'build','--webpack',fixture],root,env);
 const base=`http://127.0.0.1:${await unusedPort()}`;
 const server=spawn(process.execPath,[next,'start',fixture,'--hostname','127.0.0.1','--port',new URL(base).port],{cwd:root,env,stdio:'inherit',shell:false});const state=observe(server);
 let interrupted=false;const interrupt=()=>{interrupted=true;void stop(server,state).catch(()=>{});};process.once('SIGINT',interrupt);process.once('SIGTERM',interrupt);
 let result='failed';try{await ready(base,state);await run([join(root,'tests/pi-run-viewer.http.acceptance.mjs')],root,{...env,PI_VIEW_TEST_URL:base});
  if(browser)await run([join(root,'tests/pi-run-viewer.browser.mjs')],root,{...env,PI_VIEW_TEST_URL:base,PI_VIEW_ARTIFACTS:directory,PI_VIEW_CAPTURE:capture?'yes':'no',PAINTER_AGENT_CHROMIUM_EXECUTABLE:process.env.PAINTER_AGENT_CHROMIUM_EXECUTABLE??'/usr/bin/chromium'});if(interrupted)throw new Error('VIEWER_INTERRUPTED');result='passed';
 }finally{process.removeListener('SIGINT',interrupt);process.removeListener('SIGTERM',interrupt);await stop(server,state);await writeFile(join(directory,'receipt.json'),JSON.stringify({source,result,browser,base,fixtureOnly:true},null,2),{mode:0o600});console.log(`Local viewer evidence: ${directory}`);}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){if(process.argv.slice(2).some(arg=>!['--browser','--capture'].includes(arg)))throw new Error('UNSUPPORTED_VIEWER_OPTION');if(process.argv.includes('--capture')&&!process.argv.includes('--browser'))throw new Error('CAPTURE_REQUIRES_BROWSER');runPiViewer(process.argv.includes('--browser'),process.argv.includes('--capture')).catch(error=>{console.error(error.message);process.exitCode=1;});}
