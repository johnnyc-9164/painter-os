import os,json,hashlib,subprocess,time,pathlib
root=pathlib.Path('/agent/workspace/painter-os-bts'); pkg=root/'packages/contractor-os-core'; supplied=pathlib.Path('/agent/workspace/painter_build_sources/backend/contractor-os-core'); out=root/'docs/evidence/backend-baseline'
def inventory(base,ignore):
 return {str(p.relative_to(base)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(base.rglob('*')) if p.is_file() and not any(part in ignore for part in p.relative_to(base).parts)}
before=inventory(pkg,{'node_modules','build'}); original=inventory(supplied,{'node_modules','build'}); buildbefore=inventory(pkg/'build',set())
(out/'source-before.json').write_text(json.dumps(before,indent=2)); (out/'supplied-source.json').write_text(json.dumps(original,indent=2)); (out/'build-before.json').write_text(json.dumps(buildbefore,indent=2))
env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1',CI='1',CONVEX_DISABLE_TELEMETRY='1',npm_config_update_notifier='false'); env['PATH']=str(pkg/'node_modules/.bin')+':'+str(root/'node_modules/.bin')+':'+env['PATH']
results=[]
for name,cmd in [('environment',['bash','-c','node --version; npm --version; command -v tsc; tsc --version; node -p "require.resolve(\'typescript/package.json\')"; node -p "require(\'typescript/package.json\').version"']),('test',['npm','test']),('check-generated',['npm','run','check:generated']),('typecheck',['npm','run','typecheck']),('test-integration',['npm','run','test:integration']),('check-syntax',['npm','run','check:syntax']),('check-packaged-component',['npm','run','check:packaged-component']),('check-composition',['npm','run','check:composition'])]:
 start=time.time()
 with (out/(name+'.log')).open('w') as log:
  log.write('COMMAND: '+ ' '.join(cmd)+'\nCWD: '+str(pkg)+'\n');log.flush()
  try: status=subprocess.run(cmd,cwd=pkg,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=300).returncode
  except subprocess.TimeoutExpired: status=124;log.write('\nTIMEOUT after 300s\n')
 (out/(name+'.exit')).write_text(str(status)+'\n');results.append(dict(name=name,command=cmd,exit=status,seconds=round(time.time()-start,3)));print(name,status,flush=True)
after=inventory(pkg,{'node_modules','build'}); buildafter=inventory(pkg/'build',set())
def diff(a,b): return {'added':sorted(b.keys()-a.keys()),'removed':sorted(a.keys()-b.keys()),'modified':sorted(k for k in a.keys()&b.keys() if a[k]!=b[k])}
def digest(a):return hashlib.sha256(''.join(k+'\0'+v+'\n' for k,v in sorted(a.items())).encode()).hexdigest()
report={'commands':results,'sourceFileCount':len(after),'suppliedFileCount':len(original),'sourceAggregateSHA256':digest(after),'suppliedAggregateSHA256':digest(original),'sourceVsSupplied':diff(original,after),'sourceBeforeVsAfter':diff(before,after),'buildBeforeVsAfter':diff(buildbefore,buildafter),'buildBeforeCount':len(buildbefore),'buildAfterCount':len(buildafter),'excludedDirectories':['node_modules','build'],'aggregateAlgorithm':'SHA256 of sorted relative-path + NUL + file-SHA256 + newline'}
(out/'source-after.json').write_text(json.dumps(after,indent=2));(out/'build-after.json').write_text(json.dumps(buildafter,indent=2));(out/'results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
