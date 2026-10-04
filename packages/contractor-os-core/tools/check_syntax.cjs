const fs=require('node:fs'),cp=require('node:child_process');
let ts;try{ts=require('typescript');}catch{ts=require(cp.execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim()+'/typescript');}
let count=0,errors=[];
function file(path){count++;const result=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true,fileName:path});for(const d of result.diagnostics??[])if(d.category===ts.DiagnosticCategory.Error)errors.push({path,message:ts.flattenDiagnosticMessageText(d.messageText,'\n')});}
function walk(path){for(const e of fs.readdirSync(path,{withFileTypes:true})){const p=path+'/'+e.name;if(e.isDirectory())walk(p);else if(p.endsWith('.ts')&&!p.endsWith('.d.ts'))file(p);}}
walk('src');walk('examples');walk('tests');
console.log(JSON.stringify({typescriptFiles:count,syntaxErrors:errors,sdkSemanticTypecheck:false},null,2));if(errors.length)process.exit(1);
